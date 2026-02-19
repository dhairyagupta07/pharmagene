import { PHENOTYPE_LABELS } from '../constants/pgkb.js'

function buildBatchPrompt(patientId, analysesToRun) {
  // Combine all the local analysis data into one big text block
  const patientDataSummary = analysesToRun.map(({ drug, analysis }) => {
    const variantSummary = analysis.detectedVariants.length > 0
      ? analysis.detectedVariants.map((v) => `${v.rsid} (${v.star_allele}, ${v.effect.replace(/_/g, ' ')})`).join(', ')
      : 'None detected — wild-type assumed'

    return `DRUG: ${drug}
- Primary Gene: ${analysis.gene}
- Diplotype: ${analysis.diplotype}
- Phenotype: ${analysis.phenotype} (${PHENOTYPE_LABELS[analysis.phenotype] ?? analysis.phenotype})
- Risk Assessment: ${analysis.riskLabel}
- Detected Variants: ${variantSummary}
- Mechanism: ${analysis.mechanism}`
  }).join('\n\n')

  return `You are a clinical pharmacogenomics specialist generating a report for a physician.

PATIENT ID: ${patientId}

DATA FOR ANALYSIS:
${patientDataSummary}

Output exactly a single JSON object where the keys are the uppercase DRUG NAMES, and the values are objects containing the clinical explanation for that specific drug. 

Structure the JSON exactly like this:
{
  "CODEINE": {
    "summary": "2-3 sentence clinical summary...",
    "mechanism_explanation": "...",
    "clinical_recommendation": "...",
    "alternative_drugs": ["drug1", "drug2"],
    "monitoring_parameters": ["param1"],
    "cpic_guideline_reference": "..."
  },
  "WARFARIN": {
    ...
  }
}`
}

export async function generateClinicalExplanation(patientId, analysesToRun) {
  const promptText = buildBatchPrompt(patientId, analysesToRun);

  try {
    // Call YOUR secure Vercel backend instead of OpenAI directly
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: promptText }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Backend API failed: ${response.status} ${errorData}`);
    }

    // The backend will now handle the OpenAI call and return the clean JSON
    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Backend Request Error:', error);
    return null; 
  }
}