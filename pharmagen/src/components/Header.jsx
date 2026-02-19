import styles from './Header.module.css'
// 1. Import your local image here (adjust the path/extension if needed)
import customLogo from '../assets/dna3.png' 

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          
          {/* 2. Replace the SVG with your imported image */}
          <img 
            src={customLogo} 
            alt="PharmaGen AI Logo" 
            className={styles.icon} 
          />
          
          <div className={styles.titleGroup}>
            <div className={styles.title}>
              PharmaGen<span className={styles.highlight}>AI</span>
            </div>
            <div className={styles.subtitle}>Clinical Pharmacogenomics</div>
          </div>
        </div>

        <div className={styles.badges}>
          <span className={styles.badge}>CPIC Guidelines v2024</span>
          <span className={styles.badge}>VCF v4.2</span>
        </div>
      </div>
    </header>
  )
}