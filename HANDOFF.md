# HANDOFF — shipping Awen Music to production (hiawen.com)

For a developer (or Claude Code). This app **already works**. The job is to **host it** and, if you want live AI, **wire a server‑side model proxy**. There is no UI to rebuild from scratch — recreate/keep the existing look exactly.

---

## 1. Architecture as it stands

- **Stack:** React 18.3.1, transpiled **in the browser** by `@babel/standalone`. No build step, no bundler, no npm. React/ReactDOM/Babel load from `unpkg` with pinned versions + SRI hashes.
- **Load order** (defined at the bottom of `Awen Study Matrix.html`):
  1. `data.js` → defines `window.AWEN` (matrix data + offline engines)
  2. `i18n.js` → defines `window.I18N` and global `window.T(key, params)`
  3. React, ReactDOM, Babel (CDN)
  4. `tweaks-panel.jsx`, `components.jsx`, `cards.jsx`, `album.jsx`, `guide.jsx`, `app.jsx` (all `type="text/babel"`)
- **Entry:** `app.jsx` ends with `ReactDOM.createRoot(document.getElementById('root')).render(<App />)`.
- **Cross‑file sharing:** because each `text/babel` script has its own scope, shared components are attached to `window` at the end of each file (e.g. `Object.assign(window, { AlbumConsole, AlbumCard })`). Keep this pattern if you stay on in‑browser Babel; drop it if you migrate to ES modules (see §4).
- **State & persistence:** all app state lives in `<App>` (`useState`) and is mirrored to `localStorage` under **`awen_matrix_state_v1`** on every change. Guide‑seen flag: `awen_guide_seen_v1`.
- **Settings:** the Tweaks panel (`tweaks-panel.jsx`) writes `theme` (`console|lofi|clean|studio`), `density` (`compact|regular`), and `useAI` (bool). Defaults live in the `/*EDITMODE-BEGIN*/ … /*EDITMODE-END*/` JSON block at the top of `app.jsx`. For production you can replace `useTweaks` with plain `localStorage`‑backed state — the host‑protocol bits in `tweaks-panel.jsx` are only needed inside the design tool.

---

## 2. The ONE external dependency: `window.claude.complete`

AI generation calls **`window.claude.complete(prompt)`** in two places in `app.jsx`:

- `callAI(s)` — single song. Builds a prompt, expects a JSON string back, slices from the first `{` to the last `}`, `JSON.parse`s it. Shape:
  ```json
  {"title","tagline","suno":{"style","prompt","exclude"},"cover","video"}
  ```
- `callAlbumAI(axis, base, recipes)` — whole album. Same pattern. Shape:
  ```json
  {"album","concept","description","description_zh","anchor","cover","video",
   "tracks":[{"title","scene","prompt"}, …]}   // tracks.length === recipes.length
  ```

`window.claude.complete` **only exists inside the design tool that produced this app.** On any real host it is `undefined`, the call throws, it's caught, and the code falls back to the deterministic offline engines in `data.js`:

- `A.fallbackPrompt(selection)` — single song
- `A.fallbackAlbum(axisKey, base, recipes)` — album

So **the app never breaks** without AI; it just generates template‑based prompts. The `useAI` toggle (`t.useAI`) gates whether `callAI` is even attempted.

> **Do NOT ship an Anthropic/OpenAI API key in the front end.** Anyone can read it in the browser. Real AI must go through a server you control (§3).

---

## 3. Wiring real AI (server‑side proxy)

Replace the `window.claude.complete(prompt)` call with a `fetch` to your own endpoint. Keep everything else (the prompt strings, the JSON‑slice parsing) unchanged.

**Front‑end shim** — add near the top of `app.jsx` (or a small module) and swap the two call sites:

```js
async function complete(prompt) {
  const r = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) throw new Error('generate failed');
  const { text } = await r.json();
  return text;                 // same contract as window.claude.complete
}
// then: const raw = await complete(prompt);   // in callAI AND callAlbumAI
```

**Serverless function** (Vercel example — `api/generate.js`). Netlify/Cloudflare equivalents are nearly identical:

```js
// Reads ANTHROPIC_API_KEY from the host's env vars — never the client.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'no prompt' });

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',     // pick your current model
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await r.json();
  const text = data?.content?.[0]?.text ?? '';
  res.status(200).json({ text });
}
```

Set `ANTHROPIC_API_KEY` in the host's environment‑variable settings. Add light **rate‑limiting / origin checks** before launch so the endpoint isn't abused (it spends your tokens). Consider caching identical recipes.

The existing prompts already instruct the model to return **minified JSON only**; the slice‑between‑braces parser tolerates stray prose. Keep the try/catch so a malformed response still falls back to the offline engine.

---

## 4. (Optional, recommended) Drop in‑browser Babel → Vite

In‑browser Babel re‑transpiles every load (slower, ships a big Babel payload). For a real product:

1. `npm create vite@latest awen-music -- --template react`
2. Move `app/cards/album/guide/components` into `src/` as `.jsx` ES modules; convert the `window.*` sharing to real `import`/`export`.
3. Keep `data.js` and `i18n.js` as modules exporting `AWEN` / `I18N` (or import for side‑effects and keep the `window` globals — both fine).
4. Replace the Google Fonts `<link>` with `@fontsource/hanken-grotesk` + `@fontsource/jetbrains-mono` (or keep the link).
5. `npm run build` → static `dist/`.

This is **nice‑to‑have**, not required. The `site/index.html` already works as a single static file.

---

## 5. Deploy → hiawen.com

**Option A — static only (offline engine), free, fastest:**
1. Put `site/index.html` into the **`awenstudio.github.io`** repo (rename to `index.html` at the root, or a subfolder).
2. Repo **Settings → Pages** → enable.
3. **Settings → Pages → Custom domain** → `hiawen.com`; add the DNS records GitHub shows (A records / CNAME) at your domain registrar; tick *Enforce HTTPS*.
   - GitHub Pages is **static‑only** — the AI proxy (§3) will *not* run here. You get the offline engine.

**Option B — with live AI:**
1. Deploy the repo to **Vercel** (or Netlify): import the GitHub repo, framework = "Other" (static) or Vite if you did §4.
2. Add `api/generate.js` and the `ANTHROPIC_API_KEY` env var.
3. Add `hiawen.com` as a custom domain in the Vercel/Netlify dashboard; update DNS as instructed.

---

## 6. Design tokens (for pixel‑faithful reproduction)

All CSS lives in the `<style>` block of `Awen Study Matrix.html`, themed via `data-theme` on `.app`. The default theme is **`console`** (dark). Core tokens are CSS variables: `--bg, --panel, --panel2, --ink, --ink-dim, --ink-faint, --line, --line2, --accent, --accent-soft, --font-ui, --font-mono`.

- **Fonts:** UI = **Hanken Grotesk** (400–800); mono = **JetBrains Mono** (400–600). Loaded from Google Fonts.
- **Accent:** teal/aqua (`--accent`, ≈ `#7fd4c9` family) on near‑black panels; soft accent fill for selected/active states.
- **Shape language:** 10px radii on cards/buttons, 6–8px on chips/labels, 1px hairline borders, geometric inline SVG icons only (no hand‑drawn art).
- Four themes exist (`console / lofi / clean / studio`) — keep all four; they're just variable overrides.

---

## 7. Pre‑launch checklist

- [ ] Decide Path A (static) or B (live AI).
- [ ] If B: deploy serverless proxy, set `ANTHROPIC_API_KEY`, add rate‑limiting + allowed‑origin check, swap `window.claude.complete` → `complete()` fetch shim in both call sites.
- [ ] Point `hiawen.com` DNS at the host; enforce HTTPS.
- [ ] Update `<title>` / add favicon + social meta (`og:image`, description) — currently minimal.
- [ ] Verify `localStorage` migration is a non‑issue (new visitors only; key `awen_matrix_state_v1`).
- [ ] Sanity‑check the offline fallback still fires if the AI endpoint errors (kill the function, confirm prompts still generate).
