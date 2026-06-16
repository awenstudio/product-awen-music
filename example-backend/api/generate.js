// Example serverless proxy for live AI generation.
// Vercel: drop this at /api/generate.js. Netlify/Cloudflare: adapt the handler signature.
// The Anthropic key is read from the host environment — it is NEVER sent to the browser.
//
// Front-end usage (replaces window.claude.complete in app.jsx):
//
//   async function complete(prompt) {
//     const r = await fetch('/api/generate', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ prompt }),
//     });
//     if (!r.ok) throw new Error('generate failed');
//     const { text } = await r.json();
//     return text;
//   }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  // --- TODO before launch: restrict origin + add rate limiting ---
  // const origin = req.headers.origin || '';
  // if (!origin.endsWith('hiawen.com')) return res.status(403).json({ error: 'forbidden' });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'no prompt' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest', // set to your current model
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await r.json();
    const text = data?.content?.[0]?.text ?? '';
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: 'upstream error' });
  }
}
