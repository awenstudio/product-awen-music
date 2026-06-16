/* Awen Study — UI components. Loaded as Babel JSX. Exports to window. */
const { useState, useRef, useEffect } = React;

/* ---------- tiny inline icons (kept geometric, no hand-drawn art) ---------- */
function Icon({ name, size = 16 }) {
  const s = { width: size, height: size, strokeWidth: 1.6, fill: 'none',
              stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    lock:   <><rect x="4" y="9" width="12" height="9" rx="1.5" /><path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" /></>,
    unlock: <><rect x="4" y="9" width="12" height="9" rx="1.5" /><path d="M6.5 9V6.5a3.5 3.5 0 0 1 6.8-1.2" /></>,
    dice:   <><rect x="3" y="3" width="14" height="14" rx="3" /><circle cx="7" cy="7" r="1.1" fill="currentColor" stroke="none"/><circle cx="13" cy="13" r="1.1" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="1.1" fill="currentColor" stroke="none"/></>,
    bolt:   <path d="M11 2 4 11h5l-1 7 7-9h-5z" />,
    copy:   <><rect x="6" y="6" width="10" height="11" rx="1.6" /><path d="M12 6V4.6A1.6 1.6 0 0 0 10.4 3H4.6A1.6 1.6 0 0 0 3 4.6v7A1.6 1.6 0 0 0 4.6 13H6" /></>,
    check:  <path d="M4 10.5 8 14.5 16 5.5" />,
    reset:  <><path d="M4 10a6 6 0 1 1 1.8 4.3" /><path d="M4 14v-3.2h3.2" /></>,
    wave:   <path d="M2 10c2 0 2-4 4-4s2 8 4 8 2-8 4-8 2 4 4 4" />,
    play:   <path d="M6 4l9 6-9 6z" fill="currentColor" stroke="none" />,
    image:  <><rect x="3" y="4" width="14" height="12" rx="2" /><circle cx="7.4" cy="8" r="1.3" /><path d="M3.5 14l4-3.4 3 2.4 3.2-3 2.8 2.6" /></>,
  };
  return <svg viewBox="0 0 20 20" style={s} aria-hidden="true">{paths[name]}</svg>;
}

/* ---------- a single selectable cell ---------- */
function Chip({ label, selected, fromRef, onClick }) {
  return (
    <button type="button"
      className={'chip' + (selected ? ' sel' : '') + (fromRef && !selected ? ' ref' : '')}
      onClick={onClick}>
      <span className="chip-dot" />
      <span className="chip-label">{label}</span>
      {selected && <span className="chip-check"><Icon name="check" size={13} /></span>}
    </button>
  );
}

/* ---------- one dimension column ---------- */
function Column({ dim, value, onPick, showLock, locked, onToggleLock, refValue }) {
  return (
    <div className={'col' + (dim.layer === 'production' ? ' col-prod' : '')}>
      <div className="col-head">
        <div className="col-headL">
          <span className="col-code">{dim.code}</span>
          <span className="col-label">{window.I18N.isZh() ? (dim.zh || dim.label) : dim.label}</span>
        </div>
        {showLock && (
          <button type="button"
            className={'col-lock' + (locked ? ' on' : '')}
            title={locked ? 'Locked — kept on shuffle' : 'Unlocked — will reshuffle'}
            onClick={onToggleLock}>
            <Icon name={locked ? 'lock' : 'unlock'} size={14} />
          </button>
        )}
      </div>
      <div className="col-body">
        {dim.options.map(opt => (
          <Chip key={opt} label={opt} selected={value === opt}
            fromRef={refValue === opt} onClick={() => onPick(dim.key, opt)} />
        ))}
      </div>
    </div>
  );
}

/* ---------- BPM is a stepped range, not a list ---------- */
function BpmColumn({ bpm, value, onPick, showLock, locked, onToggleLock }) {
  return (
    <div className="col col-prod col-bpm">
      <div className="col-head">
        <div className="col-headL">
          <span className="col-code">{bpm.code}</span>
          <span className="col-label">{T('tempo')}</span>
        </div>
        {showLock && (
          <button type="button" className={'col-lock' + (locked ? ' on' : '')}
            onClick={onToggleLock} title={locked ? 'Locked' : 'Unlocked'}>
            <Icon name={locked ? 'lock' : 'unlock'} size={14} />
          </button>
        )}
      </div>
      <div className="col-body bpm-body">
        <div className="bpm-read"><span className="bpm-num">{value}</span><span className="bpm-unit">bpm</span></div>
        <div className="bpm-grid">
          {bpm.values.map(v => (
            <button key={v} type="button"
              className={'bpm-opt' + (value === v ? ' sel' : '')}
              onClick={() => onPick('bpm', v)}>{v}</button>
          ))}
        </div>
        <div className="bpm-note">{T('brandRange')}</div>
      </div>
    </div>
  );
}

/* ---------- striped image placeholder ---------- */
function Placeholder({ label, ratio = '1 / 1' }) {
  return <div className="ph" style={{ aspectRatio: ratio }}><span className="ph-tag">{label}</span></div>;
}

/* ---------- reference (imported lo-fi) card, shown in Decompose mode ---------- */
function ReferenceCard({ sample, sel, onApply, onReset }) {
  const A = window.AWEN;
  const muts = A.mutations(sel);
  return (
    <div className="refcard">
      <Placeholder label="cover art" />
      <div className="refcard-body">
        <div className="refcard-kicker">DECOMPOSED SAMPLE</div>
        <div className="refcard-title">{sample.label}</div>
        <div className="refcard-sub">{sample.source} · {sample.id.slice(0, 10)}… — {sample.sub}</div>
        <div className="refcard-chips">
          {Object.entries(sample.decomposed).map(([k, v]) => (
            <span key={k} className="refchip"><b>{(A.DIMS.find(d => d.key === k)?.code) || 'BPM'}</b>{v}</span>
          ))}
        </div>
        <div className="refcard-actions">
          <button type="button" className="btn btn-ghost sm" onClick={onReset}>
            <Icon name="reset" size={14} /> Reset to source
          </button>
          <div className="refcard-diff">
            {muts === 0 ? 'identical to source' : `${muts} mutation${muts > 1 ? 's' : ''} from source`}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- robust clipboard copy: works inside sandboxed iframes too ---------- */
async function copyText(text) {
  // 1) modern API (needs secure context + permission — often blocked in embedded preview)
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through */ }
  // 2) legacy execCommand via a temporary textarea
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) { return false; }
}

/* ---------- copy-to-clipboard button ---------- */
function CopyBtn({ text, label }) {
  const [state, setState] = useState('idle'); // idle | done | fail
  return (
    <button type="button" className={'copy' + (state === 'done' ? ' done' : '') + (state === 'fail' ? ' fail' : '')}
      onClick={async () => {
        const ok = await copyText(text);
        setState(ok ? 'done' : 'fail');
        setTimeout(() => setState('idle'), 1700);
      }}>
      <Icon name={state === 'done' ? 'check' : 'copy'} size={13} />
      {state === 'done' ? T('copied') : state === 'fail' ? T('copyFail') : (label || T('copy'))}
    </button>
  );
}

Object.assign(window, { Icon, Chip, Column, BpmColumn, Placeholder, ReferenceCard, CopyBtn });
