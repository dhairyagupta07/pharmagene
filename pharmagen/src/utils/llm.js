import { PHENOTYPE_LABELS } from '../constants/pgkb.js'

const MODEL = 'gemini-2.5-flash'

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
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing Gemini API Key!');
    return null;
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: buildBatchPrompt(patientId, analysesToRun) }]
        }],
        generationConfig: {
          temperature: 0.2, 
          response_mime_type: "application/json" 
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Returns an object containing all drugs: { "CODEINE": {...}, "WARFARIN": {...} }
    return JSON.parse(rawText);
    
  } catch (error) {
    console.error('Gemini Batch Generation Error:', error);
    return null; // The app will automatically fall back to rule-based recommendations
  }
}