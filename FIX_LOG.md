# Fix Log

A record of bugs caught, what caused them, and the lessons that should prevent the same class of issue from coming back. Newest at top.

Use this as a checklist during future code reviews — the patterns in **Lesson** sections are the ones that historically bite us.

---

## 2026-06-20 — Round 2: Robustness & UX polish

### 🔴 #1 Unsafe localStorage in 4 places
- **What broke:** Token-related `localStorage.{get,set,remove}Item` calls had no try-catch. In Safari Private Mode, or when the storage quota is exceeded, these throw — and there was no handler, so the entire AI flow died silently.
- **Fix:** Introduced a `safeLS = { get, set, del }` helper that wraps each call in try-catch. All token reads/writes now go through it. The existing app-state `useEffect` was already wrapped, so it was untouched.
- **Lesson:** *Every* `localStorage` access in this codebase must go through `safeLS`. There is no situation where bare `localStorage.X(...)` is acceptable — Safari Private throws on `setItem` even when storage seems empty.

### 🔴 #2 No timeout on `fetch()` to AI Worker
- **What broke:** If the Cloudflare Worker hung (cold start, network blip), the user saw an infinite "Generating…" spinner with no way to recover except refresh.
- **Fix:** `complete()` now creates an `AbortController`, schedules `ctrl.abort()` after 30 s (`API_TIMEOUT_MS`), and `clearTimeout`s in `finally`. The `AbortError` is rethrown as a friendly `T('aiTimeout')` so the catch-block toast can display a useful message.
- **Lesson:** *Every* outbound `fetch()` to anything we don't control needs a timeout. The pattern is: `AbortController` + `signal` + `clearTimeout` in `finally`. No exceptions.

### 🔴 #3 AI toggle was clearing the access token
- **What broke:** Turning the AI toggle OFF removed `awen_music_token` from localStorage. Users who toggled AI off mid-session were forced to re-enter their password the next time they turned it back on. Pure friction; no security benefit (the token is only useful when AI is on anyway).
- **Fix:** The toggle handler is now `onClick={() => setTweak('useAI', !t.useAI)}` — nothing more. Token removal is reserved for an explicit "log out" gesture or an actual 401 from the Worker.
- **Lesson:** A control should do exactly one thing and own only its own side-effect. Cross-coupling unrelated state ("toggle X also clears Y") creates user-visible surprise and tomorrow's bug report.

### 🟠 #4 `window.prompt()` for password entry
- **What broke:** The native prompt is ugly on every OS, sometimes outright blocked on iOS Safari, can't be styled or themed, and can't show/hide the password.
- **Fix:** New `<TokenModal>` React component — themed input with show/hide toggle, Esc/click-backdrop to cancel, autofocus on open. The `complete()` flow asks for a token via a `Promise` that resolves when the modal is submitted (`window.dispatchEvent('awen-need-token')` from data layer ↔ `useEffect` listener in App).
- **Lesson:** Native `prompt/alert/confirm` are appropriate for tooling and tests, not for shipped UI. If a user can see it, build a real component.

### 🟠 #5 `window.alert()` for AI errors
- **What broke:** AI generation failures showed an OS modal that blocked the page and had no retry affordance.
- **Fix:** New `<ToastContainer>` + `pushToast({ msg, kind, actionLabel, action })` helper. Errors render as a top-right toast with a "Retry" button that re-invokes the same flow. Auto-dismisses after 5 s (or 6 s for album builds). Errors get a red left border via `.toast.error`.
- **Lesson:** All non-blocking feedback should go through `pushToast`. Reserve native modals for truly blocking decisions (data loss confirmations only).

### 🟡 #7 `metadataGen` recomputed on every parent re-render
- **What broke:** AlbumCard ran `A.metadataGen(data, base)` inside an IIFE on every render — that includes a `.map().join('\n')` over the tracklist. Status toggles, language switches, and parent re-renders all paid this cost N times for N albums on the shelf.
- **Fix:** Wrapped in `React.useMemo(() => …, [data, album.base])`. Now recomputed only when the album's underlying inputs change.
- **Lesson:** Any non-trivial pure derivation rendered inside a frequently-updating component is a memo candidate. Quick heuristic: if it's an IIFE (`(() => {…})()`) inside JSX, it should be `React.useMemo`.

### 🟡 #8 Every state change wrote the full app state to localStorage synchronously
- **What broke:** The persistence `useEffect` had 10 dependencies and serialized the entire app state on every keystroke / status cycle / mouse drag. With ~50 generated songs on the shelf, this was a ~10 ms hit per change.
- **Fix:** Added a `_writeTimer` ref that debounces writes to one per 400 ms. Cleanup function cancels the pending write on unmount.
- **Lesson:** `useEffect` watching frequently-changing state should debounce side-effects (especially serializing/persisting). 400 ms is invisible to users and cuts writes by ~95%.

### ♿ #11 Static `<html lang>`, no favicon, no social meta
- **What broke:** `<html lang="zh-CN">` was hardcoded but the UI is bilingual — screen readers and search engines were lied to. No favicon meant a blank browser tab. No `og:title/description` meant ugly previews when pasted into Discord/X/Slack.
- **Fix:** `useEffect([lang])` syncs `document.documentElement.lang`. Added inline SVG favicon (no extra HTTP request), `<meta name="description">`, and minimal Open Graph tags.
- **Lesson:** Bilingual apps must update `<html lang>` dynamically. Every shipped page needs description + favicon + at minimum `og:title` and `og:description`.

### ♿ #12 Mode buttons + status badges had no ARIA state
- **What broke:** A screen-reader user couldn't tell which mode was active or what the status badge meant.
- **Fix:** Mode buttons get `aria-pressed={mode === m}`. Status badges get `aria-label={'Status: X, click to cycle'}`.
- **Lesson:** Toggle/selection groups need `aria-pressed` or `aria-selected`. Any button whose visible label requires CSS context to read needs `aria-label`.

### 🐞 Process bug: inserted code into the wrong `<script type="text/babel">` block
- **What broke:** Mid-fix, I did `replaceText(html, 'function App() {', '<new components>\n\nfunction App() {')`. There are *two* `function App() {` occurrences in the file: one in the **commented-out usage example** inside `tweaks-panel.jsx`, and one in the actual App component ~1700 lines later. The literal substring matched the commented one first, so the new components were spliced into the wrong script block and immediately broke the tweaks-panel parser.
- **Fix:** Surgical run_script that:
  1. Captured the misplaced block
  2. Restored the original `// function App() {` comment line in tweaks-panel
  3. Re-inserted the components before the *real* App (located by line number, not substring)
- **Lesson:** When inserting before an anchor that might appear in multiple places (especially inside commented-out demo code), **never** use a bare `replaceText`. Either:
  - Add enough surrounding context to make the anchor unique, or
  - Find by line range from a known component (e.g. "before line N inside script block #6").
  - For multi-block HTML files: parse out each `<script type="text/babel">` block and operate on the right one.

---

## 2026-06-20 — Round 1: V2 Universe Engine

(Pre-existing log entries — see CHANGELOG.md for the feature list itself.)

### Process bug: broken JSX comment `*/` → `*/}`
- **What broke:** Twice during this session, a `replaceText` ate the closing `}` of a JSX comment, producing `{/* … */` (without the closing brace). Babel choked with `Unexpected token, expected ","` at the comment line.
- **Fix:** Manually re-added the `}` on each occurrence.
- **Lesson:** JSX comments are `{/* … */}` — the trailing `}` is part of the syntax, not the comment. When `replaceText`ing JSX, always include enough surrounding context to keep `{/* … */}` intact, or grep for `*/\n` (without `}`) after the edit to catch this regression.

---

## Standing Rules (apply to every change going forward)

1. **localStorage** — always via `safeLS`. Never bare `localStorage.X(...)`.
2. **fetch** — always via an `AbortController` with a timeout. No timeout = bug.
3. **window.alert / prompt / confirm** — banned in product code. Use `<TokenModal>` / `pushToast` / a real confirmation modal.
4. **Cross-coupled state** — a control should mutate only its own state. If "toggling X also clears Y" feels obvious, write a test or a comment explaining why and consider a separate explicit affordance.
5. **JSX comments** — always `{/* … */}` (both braces). After any large `replaceText`, search for `*/\n` (unclosed) and `function App() {` (multiple matches) before assuming the edit landed correctly.
6. **Memoize** any non-trivial derivation that's an IIFE inside JSX.
7. **Debounce** any `useEffect` that writes to localStorage / fires network requests / does heavy work.
8. **aria-pressed** on toggle buttons, **aria-label** on icon-only or status-cycle buttons.
9. **HTML lang** must follow the UI language, not be hardcoded.
10. **Multi-block HTML files** — when inserting code with `replaceText`, count how many times the anchor appears in the file first. If it's >1, add context until it's unique, or use line-range targeting.
