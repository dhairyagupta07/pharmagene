import { useState } from 'react'
import { DRUG_GENE_MAP } from '../constants/pgkb.js'
import styles from './DrugSelector.module.css'

const SUPPORTED_DRUGS = Object.keys(DRUG_GENE_MAP)

export default function DrugSelector({ value, onChange }) {
  // Parse the current selection from the comma-separated string
  const selected = value
    .split(',')
    .map((d) => d.trim().toUpperCase())
    .filter(Boolean)

  const toggle = (drug) => {
    const next = selected.includes(drug)
      ? selected.filter((d) => d !== drug)
      : [...selected, drug]
    onChange(next.join(', '))
  }

  return (
    <div className={styles.card}>
      <div className={styles.label}>02 / MEDICATIONS</div>
      <h2 className={styles.title}>Select Drugs to Analyze</h2>

      <div className={styles.chipGrid}>
        {SUPPORTED_DRUGS.map((drug) => {
          const isActive = selected.includes(drug)
          return (
            <button
              key={drug}
              className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
              onClick={() => toggle(drug)}
              title={DRUG_GENE_MAP[drug].mechanism}
            >
              <span className={styles.chipName}>{drug}</span>
              <span className={styles.chipGene}>{DRUG_GENE_MAP[drug].gene}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.divider}>
        <span>or type manually</span>
      </div>

      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="CODEINE, WARFARIN, ..."
        spellCheck={false}
      />

      {selected.length > 0 && (
        <div className={styles.selectionSummary}>
          {selected.length} drug{selected.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
