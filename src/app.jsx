/* Awen Study — Matrix Generator. Main app: mode orchestration, AI generation,
   persistence, theming. Babel JSX. Uses React.useState directly (no top-level
   hook destructuring) to avoid global-const collisions across babel scripts. */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "console",
  "density": "regular",
  "useAI": true
} /*EDITMODE-END*/;

const STORE_KEY = 'awen_matrix_state_v1';
const GUIDE_KEY = 'awen_guide_seen_v1';

const MODE_INFO = {
  pick: { label: 'Pick', zh: '点选每列一个元素，拼出一首歌' },
  shuffle: { label: 'Shuffle', zh: '锁定满意的维度，摇号生成其余（老虎机式）' },
  decompose: { label: 'Decompose', zh: '从导入的参考曲拆解出发，逐项变异 remix' },
  album: { label: 'Album', zh: '锁定声音身份，沿一条行进轴一次铺出整张专辑' }
};

function loadState() {
  try {return JSON.parse(localStorage.getItem(STORE_KEY)) || null;} catch (e) {return null;}
}

function App() {
  const A = window.AWEN;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const saved = React.useRef(loadState()).current;
  const [mode, setMode] = React.useState(saved?.mode || 'pick');
  const [sel, setSel] = React.useState(saved?.sel || { ...A.DEFAULTS });
  const [locks, setLocks] = React.useState(saved?.locks || {});
  const [songs, setSongs] = React.useState(saved?.songs || []);
  const [albums, setAlbums] = React.useState(saved?.albums || []);
  const [axisKey, setAxisKey] = React.useState(saved?.axisKey || 'day');
  const [trackCount, setTrackCount] = React.useState(saved?.trackCount || 10);
  const [albumSeq, setAlbumSeq] = React.useState(saved?.albumSeq || 1);
  const [seq, setSeq] = React.useState(saved?.seq || 1);
  const [busy, setBusy] = React.useState(false);
  const [rolling, setRolling] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(false);
  const [lang, setLang] = React.useState(saved?.lang || 'zh');
  window.I18N.lang = lang; // set before children render so T() resolves correctly

  // First-visit: auto-open the usage guide once.
  React.useEffect(() => {
    try {if (!localStorage.getItem(GUIDE_KEY)) {setShowGuide(true);localStorage.setItem(GUIDE_KEY, '1');}} catch (e) {}
  }, []);

  // persist
  React.useEffect(() => {
    const clean = songs.filter((s) => !s.generating);
    const cleanAlb = albums.filter((a) => !a.generating);
    try {localStorage.setItem(STORE_KEY, JSON.stringify({ mode, sel, locks, songs: clean, albums: cleanAlb, seq, albumSeq, axisKey, trackCount, lang }));} catch (e) {}
  }, [mode, sel, locks, songs, albums, seq, albumSeq, axisKey, trackCount, lang]);

  function pick(key, val) {setSel((prev) => ({ ...prev, [key]: val }));}
  function toggleLock(key) {setLocks((prev) => ({ ...prev, [key]: !prev[key] }));}

  function switchMode(m) {
    setMode(m);
    if (m === 'decompose') setSel({ ...A.REFERENCE.decomposed });
  }

  function shuffle() {
    setRolling(true);
    let ticks = 0;
    const iv = setInterval(() => {
      setSel((prev) => {
        const next = { ...prev };
        A.DIMS.forEach((d) => {if (!locks[d.key]) next[d.key] = A.rand(d.options);});
        if (!locks.bpm) next.bpm = A.rand(A.BPM.values);
        return next;
      });
      if (++ticks >= 6) {clearInterval(iv);setRolling(false);}
    }, 55);
  }

  // AI proxy — points to Cloudflare Worker; update WORKER_URL after deploy
  const WORKER_URL = 'https://awen-music-api.awenstudio.workers.dev';
  async function complete(prompt) {
    const r = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!r.ok) throw new Error('worker ' + r.status);
    const { text } = await r.json();
    return text;
  }

  async function callAI(s) {
    const prompt =
    `You are the prompt engine for "Awen Study", a lo-fi study-music content factory run by awen yang.
Given a song RECIPE (one value per matrix dimension), write production-ready prompts.

RECIPE
- Environment: ${s.environment}
- Nature: ${s.nature}
- Time: ${s.time}
- Mood: ${s.mood}
- Instrument: ${s.instrument}
- Style: ${s.style}
- BPM: ${s.bpm}

Return ONLY minified JSON (no markdown, no commentary) with EXACTLY this shape:
{"title":"evocative 2-5 word Title Case song name","tagline":"3-6 word mood tagline lowercase","suno":{"style":"comma-separated Suno style tags under 140 chars; MUST include a production/texture layer (e.g. warm tape saturation, vinyl crackle, drum treatment or 'no drums', room reverb, low-pass) plus genre, mood, instrument, bpm, instrumental","prompt":"ONE short instrumental sentence (Suno barely reads this for instrumentals — keep it tight)","exclude":"comma-separated elements to exclude"},"cover":"square 1:1 album-cover art prompt: strong centered composition, calm negative space near the top for a title, light + mood, no text, no motion words","video":"16:9 looping background-video prompt: slow cinematic camera drift, lighting, shallow depth of field, seamless loop"}
Keep everything calm, warm, instrumental and study-friendly. No vocals.`;
    const raw = await complete(prompt);
    const a = raw.indexOf('{'),b = raw.lastIndexOf('}');
    if (a < 0 || b < 0) throw new Error('no json');
    const j = JSON.parse(raw.slice(a, b + 1));
    if (!j.title || !j.suno || !j.suno.prompt || !(j.cover || j.video)) throw new Error('bad shape');
    return {
      title: String(j.title).slice(0, 60),
      tagline: j.tagline ? String(j.tagline) : `${s.mood.toLowerCase()} · ${s.time.toLowerCase()}`,
      suno: {
        style: String(j.suno.style || ''),
        prompt: String(j.suno.prompt),
        exclude: String(j.suno.exclude || 'vocals, lyrics')
      },
      cover: String(j.cover || ''),
      video: String(j.video || j.veo || '')
    };
  }

  async function generate() {
    if (busy) return;
    const id = 'AWN-' + String(seq).padStart(4, '0');
    setSeq((n) => n + 1);
    const baseSel = { ...sel };
    const muts = A.mutations(baseSel);
    const lineage = mode === 'decompose' ?
    muts === 0 ? 'cloned from REF' : `mutated from REF · ${muts} change${muts > 1 ? 's' : ''}` :
    null;
    setSongs((prev) => [{ id, sel: baseSel, status: 'Draft', generating: true, lineage }, ...prev]);
    setBusy(true);

    let ai = null;
    if (t.useAI) {try {ai = await callAI(baseSel);} catch (e) {ai = null;}}
    if (!ai) ai = A.fallbackPrompt(baseSel);

    setSongs((prev) => prev.map((x) => x.id === id ? { ...x, generating: false, ai } : x));
    setBusy(false);
  }

  function setStatus(id, status) {setSongs((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));}
  function removeSong(id) {setSongs((prev) => prev.filter((s) => s.id !== id));}

  // ---- album generation: one AI call returns the whole coherent album ----
  async function callAlbumAI(axis, base, recipes) {
    const lines = recipes.map((s, i) =>
    `${i + 1}. env=${s.environment}; nature=${s.nature}; time=${s.time}; mood=${s.mood}; inst=${s.instrument}; style=${s.style}; bpm=${s.bpm}`).join('\n');
    const prompt =
    `You are the album engine for "Awen Study", a lo-fi study-music label by awen yang.
Design ONE coherent instrumental album. All tracks share a fixed sonic identity; only the "${axis.label}" axis progresses across them (${axis.moves.join(' + ')}).

TRACKS (one recipe per line):
${lines}

Return ONLY minified JSON, no markdown, EXACTLY:
{"album":"evocative 2-4 word album title (Title Case)","concept":"one-line concept under 90 chars","description":"a 2-3 sentence liner note: the inspiration/source behind the album, the journey it traces, and what kind of tracks it gathers; reference the opening and closing track feel","description_zh":"the SAME liner note written naturally in fluent simplified Chinese (简体中文)","anchor":"a single shared Suno style string (under 150 chars) reused on every track; MUST include a production/texture layer (warm tape saturation, vinyl crackle, drum treatment or 'no drums', room reverb, low-pass) so timbre stays consistent","cover":"square 1:1 cover-art prompt: centered composition with negative space near the top for the album title, light + mood, no text, no motion words","video":"16:9 looping background-video prompt with slow cinematic camera drift + lighting, shallow depth of field, seamless loop","tracks":[{"title":"evocative 2-4 word track title","scene":"2-4 word scene label","prompt":"one-sentence Suno description for THIS track"}]}
The tracks array MUST have exactly ${recipes.length} items, in order. Everything calm, warm, instrumental, study-friendly, no vocals.`;
    const raw = await complete(prompt);
    const a = raw.indexOf('{'),b = raw.lastIndexOf('}');
    if (a < 0 || b < 0) throw new Error('no json');
    const j = JSON.parse(raw.slice(a, b + 1));
    if (!j.album || !Array.isArray(j.tracks) || j.tracks.length !== recipes.length) throw new Error('bad shape');
    return {
      album: String(j.album).slice(0, 60),
      concept: String(j.concept || ''),
      description: String(j.description || ''),
      descriptionZh: String(j.description_zh || ''),
      anchor: String(j.anchor || ''),
      cover: String(j.cover || ''),
      video: String(j.video || ''),
      tracks: j.tracks.map((t, i) => ({
        title: String(t.title || `Track ${i + 1}`),
        scene: String(t.scene || `${recipes[i].time} · ${recipes[i].environment}`),
        prompt: String(t.prompt || '')
      }))
    };
  }

  async function buildAlbum() {
    if (busy) return;
    const { axis, recipes } = A.buildAlbum(axisKey, sel, trackCount);
    const id = 'ALB-' + String(albumSeq).padStart(3, '0');
    setAlbumSeq((n) => n + 1);
    setAlbums((prev) => [{ id, axisLabel: axis.label, status: 'Draft', generating: true }, ...prev]);
    setBusy(true);
    let data = null;
    if (t.useAI) {try {data = await callAlbumAI(axis, sel, recipes);} catch (e) {data = null;}}
    if (!data) data = A.fallbackAlbum(axisKey, sel, recipes);
    setAlbums((prev) => prev.map((x) => x.id === id ? { ...x, generating: false, data } : x));
    setBusy(false);
  }
  function setAlbumStatus(id, status) {setAlbums((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));}
  function removeAlbum(id) {setAlbums((prev) => prev.filter((a) => a.id !== id));}

  const showLock = mode === 'shuffle';
  const sampleRef = A.REFERENCE;

  return (
    <div className="app" data-theme={t.theme} data-density={t.density}>
      {/* top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">Awen</div>
          <div className="brand-sub">MATRIX GENERATOR</div>
        </div>
        <div className="modes">
          {Object.keys(MODE_INFO).map((m) =>
          <button key={m} type="button"
          className={'mode-btn' + (mode === m ? ' on' : '')}
          onClick={() => switchMode(m)}>{MODE_INFO[m].label}</button>
          )}
        </div>
        <button type="button" className="help-btn" onClick={() => setShowGuide(true)}>
          <span className="help-q">?</span> {T('help')}
        </button>
        <div className="lang-toggle">
          <button type="button" className={'lang-opt' + (lang === 'zh' ? ' on' : '')}
          onClick={() => setLang('zh')}>中</button>
          <button type="button" className={'lang-opt' + (lang === 'en' ? ' on' : '')}
          onClick={() => setLang('en')}>EN</button>
        </div>
        <div className="topstat">
          <span className="topstat-n">{mode === 'album' ? albums.filter((a) => !a.generating).length : songs.filter((s) => !s.generating).length}</span>
          <span className="topstat-l">{mode === 'album' ? T('albumsBuilt') : T('songsProduced')}</span>
        </div>
      </header>

      <div className="mode-hint">{T({ pick: 'hintPick', shuffle: 'hintShuffle', decompose: 'hintDecompose', album: 'hintAlbum' }[mode])}</div>

      {/* reference card in decompose mode */}
      {mode === 'decompose' &&
      <ReferenceCard sample={sampleRef} sel={sel}
      onReset={() => setSel({ ...sampleRef.decomposed })}
      onApply={() => setSel({ ...sampleRef.decomposed })} />
      }

      {/* the matrix board */}
      <div className={'board' + (rolling ? ' rolling' : '')}>
        {A.DIMS.map((d) =>
        <Column key={d.key} dim={d} value={sel[d.key]} onPick={pick}
        showLock={showLock} locked={!!locks[d.key]} onToggleLock={() => toggleLock(d.key)}
        refValue={mode === 'decompose' ? sampleRef.decomposed[d.key] : null} />
        )}
        <BpmColumn bpm={A.BPM} value={sel.bpm} onPick={pick}
        showLock={showLock} locked={!!locks.bpm} onToggleLock={() => toggleLock('bpm')} />
      </div>

      {/* console — album mode swaps in the axis builder */}
      {mode === 'album' ?
      <AlbumConsole axisKey={axisKey} count={trackCount} base={sel} busy={busy}
      onAxis={setAxisKey} onCount={setTrackCount} onBuild={buildAlbum} /> :

      <RecipeBar sel={sel} mode={mode} busy={busy} mutations={A.mutations(sel)}
      onGenerate={generate} onShuffle={shuffle} />
      }

      {/* production feed */}
      {mode === 'album' ?
      <div className="feed">
          <div className="feed-head">
            <span className="feed-title">{T('albumShelf')}</span>
            {albums.length > 0 &&
          <button type="button" className="feed-clear" onClick={() => setAlbums([])}>{T('clearAll')}</button>
          }
          </div>
          {albums.length === 0 ?
        <div className="empty">
              <Icon name="wave" size={22} />
              <p>{T('emptyAlbum')}</p>
            </div> :

        <div className="albshelf">
              {albums.map((a) =>
          <AlbumCard key={a.id} album={a} onStatus={setAlbumStatus} onDelete={removeAlbum} />
          )}
            </div>
        }
        </div> :

      <div className="feed">
          <div className="feed-head">
            <span className="feed-title">{T('prodFeed')}</span>
            {songs.length > 0 &&
          <button type="button" className="feed-clear" onClick={() => setSongs([])}>{T('clearAll')}</button>
          }
          </div>
          {songs.length === 0 ?
        <div className="empty">
              <Icon name="wave" size={22} />
              <p>{T('emptySong')}</p>
            </div> :

        <div className="feed-list">
              {songs.map((s) =>
          <SongCard key={s.id} song={s} onStatus={setStatus} onDelete={removeSong} />
          )}
            </div>
        }
        </div>
      }

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Look" />
        <TweakRadio label="Theme" value={t.theme}
        options={['console', 'lofi', 'clean', 'studio']}
        onChange={(v) => setTweak('theme', v)} />
        <TweakRadio label="Density" value={t.density}
        options={['compact', 'regular']}
        onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Engine" />
        <TweakToggle label="AI prompt generation" value={t.useAI}
        onChange={(v) => setTweak('useAI', v)} />
      </TweaksPanel>
      <Guide open={showGuide} onClose={() => setShowGuide(false)} />
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);