# Awen Music — Matrix Generator

> **Current version: V2.2** — Musical Coherence Engine + Track Role Signatures

A web tool that turns an 11‑dimension "recipe" (7 sonic + 4 visual) into ready‑to‑paste **Suno** music prompts, **cover‑art** prompts, **video** prompts, and full **album** production plans — for a lo‑fi study‑music content factory. Features universe building, track role systems, motif recurrence, and one‑click metadata generation for YouTube / Spotify.

**Live site:** [hiawen.com/music](https://hiawen.com/music/)  
**Deployment repo:** [awenstudio/awenstudio.github.io](https://github.com/awenstudio/awenstudio.github.io) (`music/index.html`)

---

## What's in this bundle

```
awen-music/
├── README.md                    ← this file
├── HANDOFF.md                   ← developer / Claude Code instructions
├── CHANGELOG.md                 ← V2.0 / V2.1 / V2.2 release notes
├── FIX_LOG.md                   ← bug history + 10 standing code rules
├── SUNO_BEST_PRACTICES.md       ← Suno usage guide + quality troubleshooting
├── CONTRIBUTING.md
├── LICENSE
├── build.py                     ← bundles src/ → docs/index.html
├── docs/
│   └── index.html               ← SELF-CONTAINED build (V2.2, synced with live)
├── src/                         ← editable source (V2.0 base, see note below)
│   ├── Awen Study Matrix.html   entry HTML
│   ├── data.js                  matrix data + offline prompt/album engine → window.AWEN
│   ├── i18n.js                  all UI strings (8 languages)              → window.I18N, window.T
│   ├── components.jsx           icons, chips, columns, copy button
│   ├── cards.jsx                recipe console + single-song result card
│   ├── album.jsx                album axis console + album result card
│   ├── guide.jsx                first-run usage guide overlay
│   ├── tweaks-panel.jsx         in-app settings (theme / density / AI toggle)
│   └── app.jsx                  <App> root: state, AI calls, layout, persistence
├── example-backend/
│   └── api/                     ← serverless function example for real AI generation
└── workers/
    └── generate.js              ← Cloudflare Worker (universal AI proxy)
```

> **Note:** `src/` files are at V2.0 level. V2.1/V2.2 features were developed directly in the single-file `docs/index.html`. A future task is to back-port V2.2 changes into the split source files.

---

## Tech stack

- **React 18.3.1 + Babel** — transpiled in-browser, no build step, no npm
- **State** — persisted to `localStorage` under `awen_matrix_state_v1`
- **AI** — calls `window.claude.complete(prompt)`; gracefully falls back to the deterministic offline engine if unavailable

---

## Run it locally

No install needed. From the `src/` folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000/Awen%20Study%20Matrix.html
```

> Opening via `file://` won't load `.jsx` modules — always use a local server.

---

## How it works

### The 7-dimension matrix

| Dimension | Options (10 each unless noted) |
|---|---|
| **Environment** | Library, Rainy Window, Cozy Desk, Cafe, Bookshop, Study Room, Greenhouse, Attic Studio, Japanese Apartment, Old Train |
| **Nature** | Rain, Light Snow, Birdsong, Distant Thunder, Wind, Fireplace, River, Cicadas, Ocean Waves, Silence |
| **Time** | Dawn, Early Morning, Morning, Noon, Afternoon, Dusk, Evening, Night, 3 AM (9 options) |
| **Mood** | Calm, Cozy, Warm, Nostalgic, Focused, Melancholy, Hopeful, Dreamy, Introspective |
| **Instrument** | Felt Piano, Grand Piano, Strings, Guitar, Rhodes, Marimba, Harp, Vibraphone, Organ, Synth Pad |
| **Style** | Ambient, Neo Classical, Lo-fi Hip Hop, Chillhop, Jazzhop, Minimal Piano, Cinematic, Dream Pop (8 options) |
| **BPM** | 55, 58, 60, 62, 65, 68, 70 |

**Brand default:** Library · Rain · Night · Calm · Felt Piano · Ambient · 60 BPM

### 4 operational modes

| Mode | What it does |
|---|---|
| **Pick** | Hand-pick one cell per column to assemble a recipe |
| **Shuffle** | Lock columns you want, randomize the rest (slot-machine style) |
| **Decompose** | Start from the reference track, mutate individual dimensions to remix |
| **Album** | Lock a sonic identity, choose an axis, generate a coherent tracklist (3–20 tracks) |

### 8 quick-start presets

Deep Focus · Morning Coffee · Rainy Day · Late Night Study · Cozy Afternoon · Creative Flow · Gentle Awakening · Midnight Session

### Generated output (per track)

Each generation produces three copy-ready blocks:

1. **Suno prompt** — Style anchor + Title + Description + Exclusions  
2. **Cover art prompt** — 1:1 square for image generation  
3. **Video prompt** — 16:9 looping background

**Texture logic:**
- Beat-driven styles (Lo-fi Hip Hop, Chillhop, Jazzhop) → `soft brushed drums, gentle swing, warm tape saturation, vinyl crackle`
- Ambient/piano styles → `no drums, warm tape saturation, soft room reverb, low-pass filter, airy, intimate`

**Status badges:** Draft → Approved → Queued → Published (track workflow states)

---

## Album mode — 10 traversal axes

| # | Axis | What moves |
|---|---|---|
| 1 | **Day Arc** | Time: dawn → midnight |
| 2 | **Place Journey** | Environment across 10 locations |
| 3 | **Seasons Turning** | Nature through seasonal sequence |
| 4 | **Morning Rise** | Time + BPM + mood, energy builds toward focus |
| 5 | **Focus Session** | BPM peaks mid-album, mood deepens |
| 6 | **Late-Night Descent** | Evening → 3 AM, decelerating tempo, inward mood |
| 7 | **Storm Passing** | Weather front building, then clearing |
| 8 | **Mood Drift** | Emotional arc: bright → introspective |
| 9 | **Comfort Arc** | Healing trajectory: lonely → calm → warm |
| 10 | **Concept EP** | Minimal variation, auto-capped at 5 tracks |

Tracks 01→N are pre-ordered along the axis (top-to-bottom = intended play order). Output includes a shared Style Anchor, liner notes (bilingual), cover + video prompts, and a per-track Suno line.

---

## Customization

### Themes (4)

| Theme | Feel |
|---|---|
| `console` | Dark blue-teal (default) |
| `lofi` | Warm tan/brown |
| `clean` | Minimal light blue |
| `studio` | Warm dark brown |

### Density modes

**Compact** / **Regular** — adjusts padding, chip height, and board height.

### Language support (8)

Simplified Chinese · English · Japanese · Korean · French · Spanish · German · Portuguese

UI labels switch instantly. Matrix dimension names stay in English by design (production consistency for Suno prompts).

---

## Deployment options

| Path | Effort | Notes |
|---|---|---|
| **Static (current)** | Already live | `docs/index.html` on GitHub Pages → hiawen.com/music. Offline engine. |
| **Real AI** | Add backend | Serverless proxy on Vercel/Netlify/Cloudflare. See `example-backend/`. **Never ship an API key in the front end.** |

---

## Project status

**Status:** v1.0 — live at [hiawen.com/music](https://hiawen.com/music/)

**v1.0 (current, live)**
- 7-dimension matrix → Suno / cover / video prompts
- Pick · Shuffle · Decompose · Album modes (10 axes)
- 8 presets, 4 themes, density modes
- 8-language UI, local persistence, offline deterministic engine

**v2.0 (planned)**
- Live AI generation backend (model-written prompts per generation)
- Automated tests for prompt/album engine + CI
- More platforms beyond Suno, expandable matrix-data format
- Shareable presets / exportable recipe links

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). For anything larger than a small fix, open an issue first.

## License

[MIT](LICENSE) © Awen Studio
