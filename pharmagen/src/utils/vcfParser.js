/**
 * VCF Parser — Variant Call Format v4.2
 *
 * Parses standard VCF files and extracts:
 *  - Patient ID (from the sample column header)
 *  - Variant records with RS IDs, gene annotations, and star alleles
 */

/**
 * Parses INFO field string into a key→value map.
 * e.g. "GENE=CYP2D6;STAR=*4;RS=3892097" → { GENE: 'CYP2D6', STAR: '*4', RS: '3892097' }
 */
function parseInfoField(infoStr) {
  const map = {}
  infoStr.split(';').forEach((field) => {
    const eqIdx = field.indexOf('=')
    if (eqIdx === -1) {
      map[field] = true
    } else {
      map[field.slice(0, eqIdx)] = field.slice(eqIdx + 1)
    }
  })
  return map
}

/**
 * Main VCF parsing function.
 *
 * @param {string} text - Raw VCF file content as a string
 * @returns {{ patientId: string, variants: Array, metadata: object }}
 */
export function parseVCF(text) {
  const lines = text.split('\n')
  const variants = []
  const metadata = { fileFormat: null, filters: [], infoDefs: [] }
  let patientId = 'PATIENT_' + Math.random().toString(36).slice(2, 7).toUpperCase()

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    // ── Meta-information lines (##) ──────────────────────────────────────────
    if (line.startsWith('##')) {
      if (line.startsWith('##fileformat=')) {
        metadata.fileFormat = line.split('=')[1]
      }
      continue
    }

    // ── Header line (#CHROM) ─────────────────────────────────────────────────
    if (line.startsWith('#CHROM')) {
      const cols = line.split('\t')
      // Sample name is in column index 9 (0-based)
      if (cols.length > 9 && cols[9].trim()) {
        patientId = cols[9].trim()
      }
      continue
    }

    // ── Data lines ───────────────────────────────────────────────────────────
    const cols = line.split('\t')
    if (cols.length < 8) continue

    const [chrom, pos, id, ref, alt, qual, filter, infoStr] = cols
    const info = parseInfoField(infoStr)

    // Resolve rsID from the ID column or from INFO RS tag
    const rsid = id && id.startsWith('rs')
      ? id
      : info.RS
        ? `rs${info.RS}`
        : null

    const gene = info.GENE || null
    const star = info.STAR || null
    const genotype = cols[9] || null

    // Only keep variants that have some pharmacogenomic annotation
    if (rsid || gene) {
      variants.push({
        chrom,
        pos,
        rsid,
        ref,
        alt,
        qual,
        filter,
        gene,
        star,
        genotype,
        info,
      })
    }
  }

  return { patientId, variants, metadata }
}

/**
 * Validates that the uploaded file looks like a real VCF.
 *
 * @param {string} text
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateVCF(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: 'File is empty.' }
  }
  if (!text.includes('##fileformat=VCF')) {
    return { valid: false, error: 'Missing VCF header (##fileformat=VCF). This may not be a valid VCF file.' }
  }
  if (!text.includes('#CHROM')) {
    return { valid: false, error: 'Missing column header line (#CHROM). File appears malformed.' }
  }
  const dataLines = text.split('\n').filter(l => l && !l.startsWith('#'))
  if (dataLines.length === 0) {
    return { valid: false, error: 'No variant records found in this VCF file.' }
  }
  return { valid: true }
}
