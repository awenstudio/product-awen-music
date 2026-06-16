/* Awen Study — usage guide overlay. Pulls content from window.I18N.guide(). */
function Guide({ open, onClose }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;

  const g = window.I18N.guide();

  return (
    <div className="guide-backdrop" onClick={onClose}>
      <div className="guide" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="guide-close" onClick={onClose} aria-label="Close">×</button>

        <div className="guide-kicker">{g.kicker}</div>
        <h2 className="guide-title">{g.title}</h2>
        <p className="guide-lead">{g.lead}</p>

        <div className="guide-sec">
          <div className="guide-h">{g.stepsH}</div>
          <div className="guide-steps">
            {g.steps.map((s, i) => (
              <div className="g-step" key={i}>
                <span className="g-step-n">{i + 1}</span>
                <div><div className="g-step-t">{s.t}</div><div className="g-step-d">{s.d}</div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="guide-sec">
          <div className="guide-h">{g.modesH}</div>
          <div className="guide-modes">
            {g.modes.map((m, i) => (
              <div className="g-mode" key={i}>
                <div className="g-mode-t">{m.t}</div>
                <div className="g-mode-d">{m.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="guide-sec">
          <div className="guide-h">{g.sunoH}</div>
          <p className="guide-note">{g.sunoNote}</p>
          <div className="guide-table">
            {g.sunoRows.map((r, i) => (
              <div className="g-row" key={i}>
                <div className="g-box">{r.box}</div>
                <div className="g-put">{r.put}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="guide-sec guide-anchor">
          <div className="guide-h">{g.anchorH}</div>
          <p className="guide-note">{g.anchorNote}</p>
        </div>

        <button type="button" className="btn btn-primary guide-go" onClick={onClose}>{g.go}</button>
      </div>
    </div>
  );
}

Object.assign(window, { Guide });
