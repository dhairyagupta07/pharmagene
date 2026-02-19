import { PHENOTYPE_LABELS } from '../constants/pgkb.js'

const MODEL = 'gpt-4o-mini'

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
  // Note: You might want to rename this environment variable in your .env file
  // to VITE_OPENAI_API_KEY so it's less confusing later!
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Missing OpenAI API Key!');
    return null;
  }

  const API_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}` // OpenAI requires the key in the header
      },
      body: JSON.stringify({
        model: MODEL, // Make sure const MODEL = 'gpt-4o-mini' at the top of your file
        messages: [{
          role: 'user',
          content: buildBatchPrompt(patientId, analysesToRun)
        }],
        temperature: 0.2, 
        response_format: { type: "json_object" } // OpenAI's way of enforcing JSON
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    const rawText = data.choices[0]?.message?.content || '{}';
    
    return JSON.parse(rawText);
    
  } catch (error) {
    console.error('OpenAI Batch Generation Error:', error);
    return null; 
  }
}