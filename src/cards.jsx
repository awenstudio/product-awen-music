/* Awen Study — recipe console + generated song card. Babel JSX, exports to window. */
const { useState: useStateC } = React;

const STATUS_ORDER = ['Draft', 'Approved', 'Queued', 'Published'];

/* ---------- the live recipe / action console ---------- */
function RecipeBar({ sel, mode, busy, mutations, onGenerate, onShuffle }) {
  const A = window.AWEN;
  const items = [...A.DIMS.map(d => ({ code: d.code, val: sel[d.key] })),
                 { code: 'BPM', val: sel.bpm }];
  return (
    <div className="console">
      <div className="console-recipe">
        <div className="console-kicker">
          {T('recipeNow')}
          {mode === 'decompose' && (
            <span className="console-mut">{mutations === 0 ? T('srcLabel') : T('mutated', { n: mutations })}</span>
          )}
        </div>
        <div className="recipe">
          {items.map(it => (
            <span key={it.code} className="rchip">
              <b>{it.code}</b>{it.val}
            </span>
          ))}
        </div>
      </div>
      <div className="console-actions">
        {mode === 'shuffle' && (
          <button type="button" className="btn btn-ghost" onClick={onShuffle} disabled={busy}>
            <Icon name="dice" size={16} /> {T('shuffleUnlocked')}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={busy}>
          <Icon name="bolt" size={16} />
          {busy ? T('genSongBusy') : T('genSong')}
        </button>
      </div>
    </div>
  );
}

/* ---------- skeleton lines while the AI call is in flight ---------- */
function Skeleton() {
  return (
    <div className="sk">
      <div className="sk-line w60" /><div className="sk-line w90" />
      <div className="sk-line w80" /><div className="sk-line w40" />
    </div>
  );
}

/* ---------- one produced song ---------- */
function SongCard({ song, onStatus, onDelete }) {
  const A = window.AWEN;
  const ai = song.ai;
  const tags = [...A.DIMS.map(d => ({ code: d.code, val: song.sel[d.key] })),
                { code: 'BPM', val: song.sel.bpm }];
  const status = song.status || 'Draft';
  const cycle = () => {
    const i = STATUS_ORDER.indexOf(status);
    onStatus(song.id, STATUS_ORDER[(i + 1) % STATUS_ORDER.length]);
  };
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-headL">
          <span className="card-id">{song.id}</span>
          {song.lineage && <span className="card-lineage">{song.lineage}</span>}
        </div>
        <div className="card-headR">
          <button type="button" className={'status s-' + status.toLowerCase()} onClick={cycle}>
            <span className="status-dot" />{T('st' + status)}
          </button>
          <button type="button" className="icon-btn" title="Delete" onClick={() => onDelete(song.id)}>×</button>
        </div>
      </div>

      {song.generating ? (
        <><div className="card-title dim">{window.I18N.isZh() ? '正在生成 Prompt…' : 'composing prompt…'}</div><Skeleton /></>
      ) : (
        <>
          <div className="card-title">{ai.title}</div>
          <div className="card-tagline">{ai.tagline}</div>

          <div className="tags">
            {tags.map(t => <span key={t.code} className="tag"><b>{t.code}</b>{t.val}</span>)}
          </div>

          <div className="block">
            <div className="block-head">
              <div className="block-labels">
                <span className="block-label"><Icon name="bolt" size={12} /> SUNO PROMPT</span>
                <span className="field-hint">→ 风格框 + 描述框</span>
              </div>
              <CopyBtn text={`=== AWEN STUDY · ${ai.title} ===\n[STYLE OF MUSIC]  → Suno 风格框\n${ai.suno.style}\n\n[TITLE]  → Suno 标题\n${ai.title}\n\n[DESCRIPTION]  → Suno 描述框（开 Instrumental）\n${ai.suno.prompt}\n\n[EXCLUDE]\n${ai.suno.exclude}`} label="Copy for Suno" />
            </div>
            <div className="kv"><span className="k">style</span><span className="v mono">{ai.suno.style}</span></div>
            <div className="kv"><span className="k">prompt</span><span className="v">{ai.suno.prompt}</span></div>
            <div className="kv"><span className="k">exclude</span><span className="v mono dim">{ai.suno.exclude}</span></div>
          </div>

          {ai.cover && (
            <div className="block">
              <div className="block-head">
                <div className="block-labels">
                  <span className="block-label"><Icon name="image" size={12} /> COVER PROMPT</span>
                  <span className="field-hint">{T('coverHint')}</span>
                </div>
                <CopyBtn text={ai.cover} />
              </div>
              <div className="kv"><span className="v">{ai.cover}</span></div>
            </div>
          )}

          <div className="block">
            <div className="block-head">
              <div className="block-labels">
                <span className="block-label"><Icon name="play" size={12} /> VIDEO PROMPT</span>
                <span className="field-hint">{T('videoHint')}</span>
              </div>
              <CopyBtn text={ai.video || ai.veo} />
            </div>
            <div className="kv"><span className="v">{ai.video || ai.veo}</span></div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { RecipeBar, Skeleton, SongCard, STATUS_ORDER });
