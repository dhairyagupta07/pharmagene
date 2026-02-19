import { useState } from 'react'
import { RISK_STYLES } from '../constants/pgkb.js'
import VariantTable from './VariantTable.jsx'
import styles from './ResultCard.module.css'

export default function ResultCard({ result }) {
  const [expanded, setExpanded]   = useState(false)
  const [showJson, setShowJson]   = useState(false)
  const [copied,   setCopied]     = useState(false)

  if (result.error) {
    return (
      <div className={styles.errorCard}>
        <strong>{result.drug}</strong>: {result.error}
      </div>
    )
  }

  const rs = RISK_STYLES[result.risk_assessment.risk_label] ?? RISK_STYLES['Unknown']

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `pharmagen_${result.patient_id}_${result.drug}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const profile = result.pharmacogenomic_profile
  const rec     = result.clinical_recommendation
  const llm     = result.llm_generated_explanation
  const qm      = result.quality_metrics

  return (
    <div
      className={styles.card}
      style={{ '--risk-color': rs.color, '--risk-bg': rs.bg }}
    >
      {/* ── Risk Banner ───────────────────────────────────────────────────── */}
      <div className={styles.banner}>
        <div className={styles.bannerLeft}>
          <div className={styles.riskLabel}>{rs.label}</div>
          <div className={styles.drugName}>{result.drug}</div>
        </div>

        <div className={styles.metaGrid}>
          {[
            { key: 'GENE',       val: profile.primary_gene       },
            { key: 'DIPLOTYPE',  val: profile.diplotype          },
            { key: 'PHENOTYPE',  val: profile.phenotype_label    },
            { key: 'CONFIDENCE', val: `${(result.risk_assessment.confidence_score * 100).toFixed(0)}%` },
          ].map(({ key, val }) => (
            <div key={key} className={styles.metaItem}>
              <span className={styles.metaKey}>{key}</span>
              <span className={styles.metaVal}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Summary ────────────────────────────────────────────────────── */}
      {llm.summary && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>AI Clinical Summary</div>
          <p className={styles.summaryText}>{llm.summary}</p>
        </div>
      )}

      {/* ── Recommendation ───────────────────────────────────────────────── */}
      <div className={styles.recBlock}>
        <div className={styles.sectionLabel}>Clinical Recommendation</div>
        <p className={styles.recText}>{rec.recommendation}</p>
        {rec.alternative_drugs?.length > 0 && (
          <p className={styles.altDrugs}>
            <span className={styles.altLabel}>Alternatives: </span>
            {rec.alternative_drugs.join(', ')}
          </p>
        )}
      </div>

      {/* ── Expand Toggle ─────────────────────────────────────────────────── */}
      <button
        className={styles.expandBtn}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '▲ Hide Details' : '▼ Show Details'}
      </button>

      {/* ── Expanded Details ──────────────────────────────────────────────── */}
      {expanded && (
        <div className={styles.details}>
          {/* Variants */}
          <div className={styles.detailSection}>
            <div className={styles.detailTitle}>
              Detected Variants ({profile.detected_variants.length})
            </div>
            <VariantTable variants={profile.detected_variants} />
          </div>

          {/* Mechanism */}
          {llm.mechanism_explanation && (
            <div className={styles.detailSection}>
              <div className={styles.detailTitle}>Biological Mechanism</div>
              <p className={styles.detailText}>{llm.mechanism_explanation}</p>
            </div>
          )}

          {/* Monitoring */}
          {rec.monitoring_parameters?.length > 0 && (
            <div className={styles.detailSection}>
              <div className={styles.detailTitle}>Monitoring Parameters</div>
              <div className={styles.chipList}>
                {rec.monitoring_parameters.map((p, i) => (
                  <span key={i} className={styles.monitorChip}>{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* CPIC Reference */}
          {rec.cpic_guideline && (
            <div className={styles.detailSection}>
              <div className={styles.detailTitle}>CPIC Guideline Reference</div>
              <p className={styles.detailText}>{rec.cpic_guideline}</p>
            </div>
          )}

          {/* Quality Metrics */}
          <div className={styles.quality}>
            <div className={styles.qualItem}><span className={styles.qualOk}>✓</span> VCF parsed successfully</div>
            <div className={styles.qualItem}><span className={styles.qualOk}>✓</span> {qm.variants_detected} total variants processed</div>
            <div className={styles.qualItem}><span className={styles.qualOk}>✓</span> {qm.pharmacogenomic_variants_found} pharmacogenomic variants found</div>
          </div>

          {/* Export Actions */}
          <div className={styles.exportRow}>
            <button className={styles.btnSecondary} onClick={() => setShowJson((v) => !v)}>
              {showJson ? 'Hide JSON' : 'View JSON'}
            </button>
            <button className={styles.btnSecondary} onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy JSON'}
            </button>
            <button className={styles.btnPrimary} onClick={handleDownload}>
              ↓ Download JSON
            </button>
          </div>

          {showJson && (
            <pre className={styles.jsonView}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
