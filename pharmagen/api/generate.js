// api/generate.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  try {
    // Securely call Gemini from the server using your environment variable
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY // Gemini requires the key in this specific header
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.2, 
          // Forces Gemini to output a valid JSON string
          responseMimeType: "application/json" 
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: `Gemini API failed: ${errorData}` });
    }

    const data = await response.json();
    
    // Gemini nests its text response differently than OpenAI
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    // Send the parsed JSON back to your frontend
    res.status(200).json(JSON.parse(rawText));

  } catch (error) {
    console.error('Server-side Gemini Error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
}
