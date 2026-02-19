// api/generate.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  try {
    // Now we securely call OpenAI from the server using process.env
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` 
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Moved model configuration to the backend
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.2, 
        response_format: { type: "json_object" } 
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ error: `OpenAI failed: ${errorData}` });
    }

    const data = await response.json();
    const rawText = data.choices[0]?.message?.content || '{}';
    
    // Send the parsed JSON back to your frontend
    res.status(200).json(JSON.parse(rawText));

  } catch (error) {
    console.error('Server-side OpenAI Error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
}