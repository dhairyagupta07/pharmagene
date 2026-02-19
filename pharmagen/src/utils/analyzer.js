/**
 * Pharmacogenomics Analysis Engine
 *
 * Combines detected VCF variants with the PGKB knowledge base to:
 *  1. Identify pharmacogenomically relevant variants per gene
 *  2. Calculate a phenotype score → phenotype classification (PM/IM/NM/RM/URM)
 *  3. Map phenotype + drug → risk label
 *  4. Build the full structured result object
 */

import {
  KNOWN_VARIANTS,
  DRUG_GENE_MAP,
  DRUG_PHENOTYPE_RISKS,
  SEVERITY_MAP,
  CONFIDENCE_MAP,
  PHENOTYPE_LABELS,
} from '../constants/pgkb.js'

/**
 * Converts a numeric phenotype activity score to a phenotype code.
 *
 * Activity score logic (adapted from CPIC guidelines):
 *  ≥ 2.0  → URM (Ultrarapid Metabolizer)
 *  ≥ 1.5  → RM  (Rapid Metabolizer)
 *  ≥ 0.5  → NM  (Normal Metabolizer)
 *  > -0.5 → IM  (Intermediate Metabolizer)
 *  else   → PM  (Poor Metabolizer)
 */
function scoreToPheontype(score) {
  if (score >= 2.0) return 'URM'
  if (score >= 1.5) return 'RM'
  if (score >= 0.5) return 'NM'
  if (score > -0.5) return 'IM'
  return 'PM'
}

/**
 * Builds a diplotype string from the list of detected variants.
 * Falls back to "*1" (wild-type) for undetected alleles.
 */
function buildDiplotype(detectedVariants) {
  const stars = detectedVariants.map((v) => v.star_allele).filter(Boolean)
  if (stars.length === 0) return '*1/*1'
  if (stars.length === 1) return `${stars[0]}/*1`
  return `${stars[0]}/${stars[1]}`
}

/**
 * Rule-based clinical recommendation fallback.
 * Used when the LLM is unavailable or returns unparseable output.
 */
export function getRuleBasedRecommendation(drug, riskLabel) {
  const recommendations = {
    CODEINE: {
      'Safe':          'Standard codeine dosing is appropriate. Monitor for adequate analgesia.',
      'Adjust Dosage': 'Reduce codeine dose by 25–50%. Consider tramadol as an alternative.',
      'Toxic':         'AVOID CODEINE — risk of life-threatening respiratory depression. Use morphine or hydromorphone at reduced doses.',
      'Ineffective':   'Codeine will not be activated to morphine. Use an alternative opioid (e.g., morphine, oxycodone).',
    },
    WARFARIN: {
      'Safe':          'Standard warfarin initiation protocols apply. Use clinical algorithms for starting dose.',
      'Adjust Dosage': 'Reduce starting warfarin dose by 25–50%. Increase INR monitoring frequency during initiation.',
      'Toxic':         'Significantly reduce warfarin dose (>50%). Intensive INR monitoring required. Consider direct oral anticoagulants.',
      'Ineffective':   'Standard dosing may be insufficient; monitor INR closely and titrate accordingly.',
    },
    CLOPIDOGREL: {
      'Safe':          'Standard clopidogrel dosing (75 mg/day) is appropriate.',
      'Adjust Dosage': 'Consider alternative antiplatelet therapy (prasugrel or ticagrelor).',
      'Toxic':         'Standard dosing; monitor for excessive bleeding risk.',
      'Ineffective':   'Clopidogrel is likely ineffective. Switch to prasugrel or ticagrelor per CPIC guidelines.',
    },
    SIMVASTATIN: {
      'Safe':          'Standard simvastatin dosing is appropriate.',
      'Adjust Dosage': 'Consider lower simvastatin dose (≤20 mg/day) or switch to pravastatin/rosuvastatin.',
      'Toxic':         'HIGH RISK of myopathy/rhabdomyolysis. Use an alternative statin (pravastatin or rosuvastatin).',
      'Ineffective':   'Standard dosing. Monitor lipid panel at 6–8 weeks.',
    },
    AZATHIOPRINE: {
      'Safe':          'Standard azathioprine dosing is appropriate. Monitor CBC periodically.',
      'Adjust Dosage': 'Reduce azathioprine dose by 30–70%. Monitor CBC weekly for first month.',
      'Toxic':         'CONTRAINDICATED — severe potentially fatal myelosuppression risk. Use alternative immunosuppressant.',
      'Ineffective':   'May require dose escalation. Monitor clinical response and CBC.',
    },
    FLUOROURACIL: {
      'Safe':          'Standard 5-FU/capecitabine dosing is appropriate.',
      'Adjust Dosage': 'Reduce 5-FU/capecitabine dose by 25–50%. Monitor closely for toxicity.',
      'Toxic':         'CONTRAINDICATED — life-threatening toxicity risk (mucositis, myelosuppression, neurotoxicity). Use alternative chemotherapy.',
      'Ineffective':   'Standard dosing. Monitor for adequate treatment response.',
    },
    OMEPRAZOLE: {
      'Safe':          'Standard omeprazole dosing is appropriate.',
      'Adjust Dosage': 'Standard dosing is generally safe, but monitor clinical response.',
      'Toxic':         'Monitor for potential side effects; consider slight dose reduction if symptoms occur.',
      'Ineffective':   'Increase starting dose by 100-200% or consider an alternative PPI not primarily metabolized by CYP2C19.',
    },
    AMITRIPTYLINE: {
      'Safe':          'Standard amitriptyline dosing is appropriate.',
      'Adjust Dosage': 'Consider a 25% dose reduction from the standard starting dose. Monitor closely.',
      'Toxic':         'Avoid amitriptyline due to high risk of adverse cardiovascular and anticholinergic effects.',
      'Ineffective':   'Consider alternative drug; standard doses may fail to achieve therapeutic concentrations.',
    },
    PHENYTOIN: {
      'Safe':          'Standard phenytoin maintenance dosing is appropriate.',
      'Adjust Dosage': 'Reduce maintenance dose by 25-50%. Monitor serum concentrations closely.',
      'Toxic':         'Significant dose reduction (50%+) required. High risk of severe dose-related neurotoxicity.',
      'Ineffective':   'Standard dosing; monitor serum levels to ensure therapeutic target is reached.',
    },
    ATORVASTATIN: {
      'Safe':          'Standard atorvastatin dosing is appropriate.',
      'Adjust Dosage': 'Consider lower starting dose (≤20 mg). Monitor for muscle pain.',
      'Toxic':         'High risk of statin-associated muscle symptoms (SAMS). Use an alternative statin like rosuvastatin.',
      'Ineffective':   'Standard dosing; monitor lipid panel for therapeutic effect.',
    },
    MERCAPTOPURINE: {
      'Safe':          'Standard mercaptopurine dosing is appropriate.',
      'Adjust Dosage': 'Reduce dose significantly and monitor complete blood count (CBC) closely.',
      'Toxic':         'CONTRAINDICATED. Severe risk of life-threatening myelosuppression.',
      'Ineffective':   'Standard dosing; monitor response and adjust as necessary.',
    },
    CAPECITABINE: {
      'Safe':          'Standard capecitabine dosing is appropriate.',
      'Adjust Dosage': 'Reduce dose by 50% and monitor closely for severe toxicity.',
      'Toxic':         'CONTRAINDICATED. High risk of severe or fatal toxicity (mucositis, diarrhea, myelosuppression).',
      'Ineffective':   'Standard dosing; monitor for adequate treatment response.',
    },
  }

  return (recommendations[drug]?.[riskLabel]) ?? 'Consult a clinical pharmacist or pharmacogenomics specialist for guidance.'
}

/**
 * Core analysis function.
 *
 * @param {Array}  variants  - Parsed VCF variant records
 * @param {string} drug      - Uppercase drug name (e.g. 'WARFARIN')
 * @returns {object|null}    - Analysis result, or null if drug is unsupported
 */
export function analyzeVariants(variants, drug) {
  const drugInfo = DRUG_GENE_MAP[drug]
  if (!drugInfo) return null

  const { gene, mechanism } = drugInfo
  const detected = []

  // Baseline activity score = 1.0 (assumes two functional alleles / NM)
  let activityScore = 1.0

  for (const v of variants) {
    const knownVariant = v.rsid ? KNOWN_VARIANTS[v.rsid] : null
    const matchesGene = knownVariant?.gene === gene || v.gene === gene

    if (knownVariant && matchesGene) {
      detected.push({
        rsid:         v.rsid,
        gene:         knownVariant.gene,
        star_allele:  knownVariant.star || v.star || 'unknown',
        effect:       knownVariant.effect,
        chromosome:   v.chrom,
        position:     v.pos,
        reference:    v.ref,
        alternate:    v.alt,
      })
      activityScore += knownVariant.phenotype_impact
    } else if (matchesGene && v.star) {
      // Gene matches but variant isn't in our DB — include with unknown effect
      detected.push({
        rsid:         v.rsid || 'unknown',
        gene:         v.gene || gene,
        star_allele:  v.star,
        effect:       'unknown',
        chromosome:   v.chrom,
        position:     v.pos,
        reference:    v.ref,
        alternate:    v.alt,
      })
    }
  }

  const phenotype  = detected.length > 0 ? scoreToPheontype(activityScore) : 'NM'
  const riskLabel  = DRUG_PHENOTYPE_RISKS[drug]?.[phenotype] ?? 'Unknown'
  const diplotype  = buildDiplotype(detected)

  return {
    gene,
    mechanism,
    diplotype,
    phenotype,
    phenotypeLabel: PHENOTYPE_LABELS[phenotype] ?? phenotype,
    riskLabel,
    severity:       SEVERITY_MAP[riskLabel]    ?? 'low',
    confidence:     CONFIDENCE_MAP[riskLabel]  ?? 0.5,
    detectedVariants: detected,
  }
}

/**
 * Assembles the final structured JSON output matching the required schema.
 */
export function buildResultObject(patientId, drug, analysis, llmData, totalVariants) {
  return {
    patient_id:  patientId,
    drug,
    timestamp:   new Date().toISOString(),

    risk_assessment: {
      risk_label:       analysis.riskLabel,
      confidence_score: analysis.confidence,
      severity:         analysis.severity,
    },

    pharmacogenomic_profile: {
      primary_gene:       analysis.gene,
      diplotype:          analysis.diplotype,
      phenotype:          analysis.phenotype,
      phenotype_label:    analysis.phenotypeLabel,
      detected_variants:  analysis.detectedVariants,
    },

    clinical_recommendation: {
      recommendation:        llmData?.clinical_recommendation ?? getRuleBasedRecommendation(drug, analysis.riskLabel),
      alternative_drugs:     llmData?.alternative_drugs        ?? [],
      monitoring_parameters: llmData?.monitoring_parameters    ?? [],
      cpic_guideline:        llmData?.cpic_guideline_reference  ?? `CPIC Guideline for ${drug}`,
    },

    llm_generated_explanation: {
      summary:                llmData?.summary               ?? '',
      mechanism_explanation:  llmData?.mechanism_explanation ?? '',
    },

    quality_metrics: {
      vcf_parsing_success:            true,
      variants_detected:              totalVariants,
      pharmacogenomic_variants_found: analysis.detectedVariants.length,
    },
  }
}
