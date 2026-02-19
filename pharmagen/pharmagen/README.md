# RxGENE-AI — Pharmacogenomic Risk Analysis

AI-powered web app that analyzes patient VCF files and predicts drug-specific pharmacogenomic risks with LLM-generated clinical explanations.

---

## Project Structure

```
pharmagen/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                    # React entry point
    ├── App.jsx                     # Root component & analysis orchestration
    ├── App.module.css
    ├── constants/
    │   └── pgkb.js                 # Pharmacogenomics knowledge base (variants, drug-gene map, risk tables)
    ├── utils/
    │   ├── vcfParser.js            # VCF v4.2 parser & validator
    │   ├── analyzer.js             # PGx analysis engine + result schema builder
    │   └── llm.js                  # Anthropic Claude API integration
    ├── components/
    │   ├── Header.jsx / .module.css
    │   ├── UploadCard.jsx / .module.css   # Drag-and-drop VCF upload
    │   ├── DrugSelector.jsx / .module.css # Chip + text drug selector
    │   ├── ResultCard.jsx / .module.css   # Per-drug result with expand/export
    │   └── VariantTable.jsx / .module.css # Detected variants table
    └── styles/
        └── global.css              # CSS variables, resets, animations
```

---

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Supported Genes & Drugs

| Drug          | Gene     | Risk Types                    |
|---------------|----------|-------------------------------|
| CODEINE       | CYP2D6   | Toxic (URM), Ineffective (PM) |
| WARFARIN      | CYP2C9   | Toxic (PM), Adjust (IM)       |
| CLOPIDOGREL   | CYP2C19  | Ineffective (PM/IM)           |
| SIMVASTATIN   | SLCO1B1  | Toxic (PM — myopathy risk)    |
| AZATHIOPRINE  | TPMT     | Toxic (PM — myelosuppression) |
| FLUOROURACIL  | DPYD     | Toxic (PM — severe toxicity)  |

---

## VCF Format

The app accepts standard VCF v4.2 files. Pharmacogenomic annotations should be in the INFO field:

```
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star allele">
##INFO=<ID=RS,Number=1,Type=String,Description="RS number">
```

A sample VCF is built into the app — click **Load Sample Patient Data** to try it.

---

## Output JSON Schema

Each drug analysis produces:

```json
{
  "patient_id": "PATIENT_XXX",
  "drug": "WARFARIN",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "risk_assessment": {
    "risk_label": "Safe|Adjust Dosage|Toxic|Ineffective|Unknown",
    "confidence_score": 0.92,
    "severity": "none|low|moderate|high|critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2C9",
    "diplotype": "*2/*1",
    "phenotype": "IM",
    "phenotype_label": "Intermediate Metabolizer",
    "detected_variants": [...]
  },
  "clinical_recommendation": {
    "recommendation": "...",
    "alternative_drugs": [...],
    "monitoring_parameters": [...],
    "cpic_guideline": "..."
  },
  "llm_generated_explanation": {
    "summary": "...",
    "mechanism_explanation": "..."
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variants_detected": 6,
    "pharmacogenomic_variants_found": 1
  }
}
```

---

## Tech Stack

- **React 18** + **Vite**
- **CSS Modules** for scoped styling
- **Anthropic Claude API** (`claude-sonnet-4-20250514`) for clinical explanations
- No external UI libraries — fully custom components
