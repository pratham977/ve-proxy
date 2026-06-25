const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/parse-10k', async (req, res) => {
  try {
    const { pdfBase64, prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'application/pdf', data: pdfBase64 } },
              { text: prompt }
            ]
          }]
        })
      }
    );

    const raw = await response.text();
    console.log('Gemini status:', response.status);
    console.log('Gemini response:', raw.slice(0, 500));

    if (!response.ok) {
      return res.status(500).json({ error: `Gemini error ${response.status}: ${raw.slice(0, 200)}` });
    }

    const data = JSON.parse(raw);
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text });
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('VE Proxy running'));
app.listen(process.env.PORT || 3000);
