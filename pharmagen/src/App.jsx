import { useState } from 'react'
import Header from './components/Header.jsx'
import UploadCard from './components/UploadCard.jsx'
import DrugSelector from './components/DrugSelector.jsx'
import ResultCard from './components/ResultCard.jsx'
import { parseVCF } from './utils/vcfParser.js'
import { analyzeVariants, buildResultObject } from './utils/analyzer.js'
import { generateClinicalExplanation } from './utils/llm.js'
import { DRUG_GENE_MAP, SAMPLE_VCF, SAMPLE_DRUGS } from './constants/pgkb.js'
import styles from './App.module.css'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  const [vcfContent, setVcfContent] = useState(null)
  const [vcfFileName, setVcfFileName] = useState(null)
  const [drugs, setDrugs] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0, drug: '' })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFile = (text, name) => {
    setVcfContent(text)
    setVcfFileName(name)
    setError(null)
  }

  const handleLoadSample = () => {
    setVcfContent(SAMPLE_VCF)
    setVcfFileName('sample_patient.vcf')
    setDrugs(SAMPLE_DRUGS)
    setError(null)
    setResults([])
  }

  const handleReset = () => {
    setVcfContent(null)
    setVcfFileName(null)
    setDrugs('')
    setResults([])
    setError(null)
    setProgress({ current: 0, total: 0, drug: '' })
  }

  const handleAnalyze = async () => {
    if (!vcfContent) {
      setError('Please upload a VCF file before running analysis.')
      return
    }

    const drugList = drugs
      .split(',')
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean)

    if (drugList.length === 0) {
      setError('Please select or enter at least one drug to analyze.')
      return
    }

    setLoading(true)
    setError(null)
    setResults([])

    try {
      const { patientId, variants } = parseVCF(vcfContent)
      const validAnalyses = []
      const finalResults = []

      // 1. Run the local rule-based analysis for all requested drugs
      for (const drug of drugList) {
        if (!DRUG_GENE_MAP[drug]) {
          finalResults.push({
            drug,
            error: `"${drug}" is not supported. Supported drugs: ${Object.keys(DRUG_GENE_MAP).join(', ')}.`,
          })
          continue
        }
        validAnalyses.push({ drug, analysis: analyzeVariants(variants, drug) })
      }

      // 2. Call the LLM ONCE for all valid drugs
      setProgress({ current: 1, total: 1, drug: `Batch analyzing ${validAnalyses.length} medications...` })
      
      let batchLlmData = null;
      if (validAnalyses.length > 0) {
        batchLlmData = await generateClinicalExplanation(patientId, validAnalyses)
      }

      // 3. Assemble the final result cards
      for (const item of validAnalyses) {
        // Extract this specific drug's LLM response from the batch object
        const drugLlmData = batchLlmData ? batchLlmData[item.drug] : null;
        
        const result = buildResultObject(
          patientId, 
          item.drug, 
          item.analysis, 
          drugLlmData, 
          variants.length
        )
        finalResults.push(result)
      }

      setResults(finalResults)
    } catch (err) {
      setError('Analysis failed: ' + err.message)
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0, drug: '' })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.app}>
      <Header />

      <main className={styles.main}>
        {/* ── Input Section ──────────────────────────────────────────────── */}
        <section className={styles.inputGrid}>
          <UploadCard
            fileName={vcfFileName}
            onFile={handleFile}
            onError={setError}
          />
          <DrugSelector value={drugs} onChange={setDrugs} />
        </section>

        {/* ── Action Area ─────────────────────────────────────────────── */}
        <div className={styles.actionRow}>
          {error && (
            <div className={styles.errorMsg} role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className={styles.primaryActions}>
            <button
              className={styles.analyzeBtn}
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loadingInner}>
                  <span className={styles.spinner} />
                  {progress.total > 0
                    ? `Analyzing ${progress.drug} (${progress.current}/${progress.total})...`
                    : 'Analyzing...'}
                </span>
              ) : (
                'Run Clinical Analysis'
              )}
            </button>
          </div>
          
          <div className={styles.secondaryActions}>
            <button
              className={styles.secondaryBtn}
              onClick={handleLoadSample}
              disabled={loading}
            >
              Load Sample Data
            </button>
            <button
              className={styles.secondaryBtn}
              onClick={handleReset}
              disabled={loading}
              title="Clear patient data and results"
            >
              Clear Workspace
            </button>
          </div>
        </div>

        {/* ── Results Section ────────────────────────────────────────────── */}
        {results.length > 0 && (
          <section className={styles.resultsSection}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>Analysis Results</h2>
              <span className={styles.resultsCount}>
                {results.filter((r) => !r.error).length} drug{results.filter((r) => !r.error).length !== 1 ? 's' : ''} analyzed
              </span>
            </div>

            <div className={styles.resultsList}>
              {results.map((r, i) => (
                <ResultCard key={i} result={r} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}