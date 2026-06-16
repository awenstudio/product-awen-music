# Awen Music — Matrix Generator

A bilingual (中文 / EN) web tool that turns a 7‑dimension "recipe" (Environment · Nature · Time · Mood · Instrument · Style · BPM) into ready‑to‑paste **Suno** music prompts, **cover‑art** prompts, and **background‑video** prompts — for a lo‑fi study‑music content factory. It also builds whole **coherent albums** by locking one sonic identity and traversing a single "axis" (a day arc, a place journey, a late‑night descent, etc.) across the tracklist.

Intended home: **hiawen.com**

---

## What's in this bundle

```
design_handoff_awen_music/
├── README.md                ← this file
├── HANDOFF.md               ← developer / Claude Code instructions (READ THIS to ship)
├── site/
│   └── index.html           ← SELF-CONTAINED build. Upload as-is to any static host.
└── src/                     ← editable source (the real project)
    ├── Awen Study Matrix.html   entry HTML (loads everything below)
    ├── data.js                  matrix data + offline prompt/album engine  → window.AWEN
    ├── i18n.js                  all 中/EN strings + guide copy             → window.I18N, window.T
    ├── components.jsx           icons, chips, columns, copy button, placeholder
    ├── cards.jsx                recipe console + single‑song result card
    ├── album.jsx                album axis console + album result card
    ├── guide.jsx                first‑run usage guide overlay
    ├── tweaks-panel.jsx         in‑app settings panel (theme / density / AI toggle)
    └── app.jsx                  <App> root: state, AI calls, layout, persistence
```

> **Note on file naming:** the source files are *functional code*, not just visual mockups. The app actually works today. Shipping it is mostly about **hosting** it and **wiring real AI** — see HANDOFF.md.

---

## Two ways to go live

| Path | Effort | Result | Where |
|---|---|---|---|
| **A. Static, today** | upload one file | Fully working tool, prompts come from the built‑in **offline engine** (deterministic, template‑based). The "AI prompt generation" toggle has no effect because there's no server. | `site/index.html` → **GitHub Pages** (`awenstudio.github.io`) or Netlify/Vercel drag‑drop. Point **hiawen.com** at it. |
| **B. Real AI** | add a tiny backend | Each generation is unique and model‑written (Suno / cover / video prompts). | Needs a host that runs serverless functions — **Vercel / Netlify / Cloudflare**, *not* GitHub Pages (it's static‑only). See HANDOFF.md §"Wiring real AI". |

Recommended: ship **A** now so the site is live, then do **B** with Claude Code.

---

## Run it locally

It's plain files, no install. From the `src/` folder:

```bash
# any static server works; pick one
python3 -m http.server 8000
# then open http://localhost:8000/Awen%20Study%20Matrix.html
```

Opening the HTML via `file://` will not load the `.jsx` modules — use a local server.

---

## How it works (1‑minute tour)

- **Matrix board** — seven columns; pick one cell per column to form the current *recipe*.
- **Modes** (top bar): **Pick** (hand‑pick), **Shuffle** (lock columns you like, slot‑machine the rest), **Decompose** (start from an imported reference and mutate), **Album** (lock identity, pick a traversal axis, generate a whole tracklist).
- **Generate** → produces a card with a **Suno prompt** (Style box + Title + Description + Exclude), a **Cover prompt** (1:1 art), and a **Video prompt** (16:9 loop). Each block has a one‑click copy button tailored to where it pastes.
- **Album mode** → one identity + one axis; track 01→N are pre‑ordered along the axis (top‑to‑bottom = intended play order). Outputs a shared **Style Anchor**, liner notes (中/EN), cover + video prompts, and a per‑track Suno line.
- **Persistence** — everything is saved to `localStorage` (`awen_matrix_state_v1`); refresh keeps your work.
- **Bilingual** — 中 / EN toggle in the top bar; all copy lives in `i18n.js`.

See **HANDOFF.md** for the exact production checklist.
