import styles from './VariantTable.module.css'

export default function VariantTable({ variants }) {
  if (variants.length === 0) {
    return (
      <div className={styles.empty}>
        No pathogenic variants detected in this gene — wild-type (*1/*1) assumed.
      </div>
    )
  }

  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <span>RSID</span>
        <span>STAR ALLELE</span>
        <span>EFFECT</span>
        <span>LOCUS</span>
      </div>

      {variants.map((v, i) => (
        <div key={i} className={styles.row}>
          <span className={styles.rsid}>{v.rsid}</span>
          <span className={styles.star}>{v.star_allele}</span>
          <span className={styles.effect}>{v.effect?.replace(/_/g, ' ')}</span>
          <span className={styles.locus}>
            {v.chromosome}:{v.position}
          </span>
        </div>
      ))}
    </div>
  )
}
