import { useRef, useState, useCallback } from 'react'
import { validateVCF } from '../utils/vcfParser.js'
import styles from './UploadCard.module.css'

export default function UploadCard({ fileName, onFile, onError }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback(
    (file) => {
      if (!file) return

      if (!file.name.endsWith('.vcf')) {
        onError('Invalid file type. Please upload a .vcf file.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        onError('File exceeds the 5 MB size limit.')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const { valid, error } = validateVCF(text)
        if (!valid) {
          onError(error)
          return
        }
        onFile(text, file.name)
      }
      reader.readAsText(file)
    },
    [onFile, onError]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      processFile(e.dataTransfer.files[0])
    },
    [processFile]
  )

  const handleChange = (e) => processFile(e.target.files[0])

  return (
    <div className={styles.card}>
      <div className={styles.label}>01 / VCF FILE</div>
      <h2 className={styles.title}>Upload Genetic Data</h2>

      <div
        className={`${styles.dropzone} ${dragging ? styles.active : ''} ${fileName ? styles.loaded : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".vcf"
          className={styles.hiddenInput}
          onChange={handleChange}
        />

        <div className={styles.icon}>
          {fileName ? '✓' : '⬆'}
        </div>

        {fileName ? (
          <>
            <div className={styles.fileName}>{fileName}</div>
            <div className={styles.hint}>File loaded — click to replace</div>
          </>
        ) : (
          <>
            <div className={styles.dropText}>Drop .vcf file here</div>
            <div className={styles.hint}>or click to browse · max 5 MB</div>
          </>
        )}
      </div>

      <div className={styles.formatNote}>
        Supports VCF v4.2 with GENE, STAR, RS INFO tags
      </div>
    </div>
  )
}
