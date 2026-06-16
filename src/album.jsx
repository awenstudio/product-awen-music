/* Awen Study — Album mode: axis picker console + album result card. Babel JSX. */
const { useState: useStateAlb } = React;

/* ---------- the album-build console (replaces RecipeBar in album mode) ---------- */
function AlbumConsole({ axisKey, count, base, busy, onAxis, onCount, onBuild }) {
  const A = window.AWEN;
  const axis = A.ALBUM_AXES.find(a => a.key === axisKey) || A.ALBUM_AXES[0];
  const moving = new Set(axis.moves);
  const capped = axis.maxTracks && count > axis.maxTracks;
  const effective = capped ? axis.maxTracks : count;
  const zh = window.I18N.isZh();
  const dimLabel = (k) => k === 'bpm' ? 'BPM' : (zh ? (A.DIMS.find(d => d.key === k)?.zh) : (A.DIMS.find(d => d.key === k)?.label)) || k;
  const movingLabels = axis.moves.map(dimLabel);
  const anchorLabels = A.anchorDims(axisKey).map(dimLabel);

  return (
    <div className="albcon">
      <div className="albcon-axes">
        <div className="albcon-kicker">{T('axisKicker')}</div>
        <div className="axis-grid">
          {A.ALBUM_AXES.map(a => (
            <button key={a.key} type="button"
              className={'axis-btn' + (a.key === axisKey ? ' on' : '')}
              onClick={() => onAxis(a.key)}>
              <span className="axis-name">{a.label}</span>
              <span className="axis-zh">{zh ? a.zh : a.en}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="albcon-side">
        <div className="anchor-readout">
          <div className="ar-row ar-move">
            <span className="ar-tag">{T('moving')}</span>
            <span className="ar-vals">{movingLabels.join(' · ')}</span>
          </div>
          <div className="ar-row ar-hold">
            <span className="ar-tag">{T('anchor')}</span>
            <span className="ar-vals">{anchorLabels.join(' · ')}</span>
          </div>
        </div>

        <div className="count-row">
          <span className="count-label">{T('tracksLabel')}</span>
          <div className="count-stepper">
            <button type="button" onClick={() => onCount(Math.max(3, count - 1))} disabled={busy}>−</button>
            <span className="count-n">{count}</span>
            <button type="button" onClick={() => onCount(Math.min(16, count + 1))} disabled={busy}>+</button>
          </div>
        </div>
        {capped && <div className="count-cap">{T('epCap', { n: axis.maxTracks })}</div>}

        <button type="button" className="btn btn-primary albcon-go" onClick={onBuild} disabled={busy}>
          <Icon name="bolt" size={16} />
          {busy ? T('buildAlbumBusy', { n: effective }) : T('buildAlbum', { n: effective })}
        </button>
      </div>
    </div>
  );
}

/* ---------- one produced album ---------- */
function AlbumCard({ album, onStatus, onDelete }) {
  const A = window.AWEN;
  const data = album.data;
  const status = album.status || 'Draft';
  const zh = window.I18N.isZh();
  const cycle = () => {
    const i = STATUS_ORDER.indexOf(status);
    onStatus(album.id, STATUS_ORDER[(i + 1) % STATUS_ORDER.length]);
  };

  const fullTracklist = data && data.tracks.map((t, i) =>
    `${String(i + 1).padStart(2, '0')}. ${t.title}  (${t.scene})\n    ${t.prompt}`).join('\n\n');
  const copyAll = data &&
`=== AWEN STUDY · ALBUM ===
${data.album}
${data.concept}

[ABOUT]
${data.description || ''}

[STYLE OF MUSIC]  → paste into Suno's Style box on EVERY track
${data.anchor}

[COVER PROMPT]  → cover art (1:1)
${data.cover}

[VIDEO PROMPT]  → background video (16:9)
${data.video || data.cover}

[TRACKLIST]  → set Instrumental ON; each track's Description = its line below
${fullTracklist}`;

  // Per-track Suno copy: self-documenting, mapped to Suno's three fields.
  const trackSuno = (tr) =>
`=== ${data.album} · ${tr.title} ===
[STYLE OF MUSIC]  → Suno 风格框
${data.anchor}

[TITLE]  → Suno 标题
${tr.title}

[DESCRIPTION]  → Suno 描述框（开 Instrumental）
${tr.prompt}`;

  return (
    <div className="album">
      <div className="album-top">
        <div className="album-cover"><Placeholder label="cover" ratio="1 / 1" /></div>
        <div className="album-meta">
          <div className="album-head">
            <span className="card-id">{album.id}</span>
            <span className="album-axis">{album.axisLabel}</span>
            <div className="album-head-r">
              <button type="button" className={'status s-' + status.toLowerCase()} onClick={cycle}>
                <span className="status-dot" />{T('st' + status)}
              </button>
              <button type="button" className="icon-btn" onClick={() => onDelete(album.id)}>×</button>
            </div>
          </div>

          {album.generating ? (
            <><div className="album-title dim">{zh ? '正在生成专辑…' : 'composing album…'}</div><Skeleton /></>
          ) : (
            <>
              <div className="album-title">{data.album}</div>
              <div className="album-concept">{data.concept}</div>
              {(zh ? (data.descriptionZh || data.description) : data.description) && (
                <div className="album-desc">
                  <span className="album-desc-tag">{T('about')}</span>
                  <p className="album-desc-body">{zh ? (data.descriptionZh || data.description) : data.description}</p>
                </div>
              )}
              <div className="block anchor-block">
                <div className="block-head">
                  <div className="block-labels">
                    <span className="block-label"><Icon name="bolt" size={12} /> STYLE ANCHOR</span>
                    <span className="field-hint">{T('anchorHint')}</span>
                  </div>
                  <CopyBtn text={data.anchor} />
                </div>
                <div className="kv"><span className="v mono">{data.anchor}</span></div>
              </div>
              <div className="block">
                <div className="block-head">
                  <div className="block-labels">
                    <span className="block-label"><Icon name="image" size={12} /> COVER PROMPT</span>
                    <span className="field-hint">{T('coverHint')}</span>
                  </div>
                  <CopyBtn text={data.cover} />
                </div>
                <div className="kv"><span className="v">{data.cover}</span></div>
              </div>
              <div className="block">
                <div className="block-head">
                  <div className="block-labels">
                    <span className="block-label"><Icon name="play" size={12} /> VIDEO PROMPT</span>
                    <span className="field-hint">{T('videoHint')}</span>
                  </div>
                  <CopyBtn text={data.video || data.cover} />
                </div>
                <div className="kv"><span className="v">{data.video || data.cover}</span></div>
              </div>
            </>
          )}
        </div>
      </div>

      {!album.generating && data && (
        <div className="tracklist">
          <div className="tracklist-head">
            <div className="block-labels">
              <span className="block-label">{T('tracklist', { n: data.tracks.length })}</span>
              <span className="field-hint">{T('tracklistHint')}</span>
            </div>
            <CopyBtn text={copyAll} label={T('copyFullAlbum')} />
          </div>
          <div className="tracklist-order">
            <span className="tracklist-order-flow">↓</span>
            {T('tracklistOrder', { n: data.tracks.length, axis: album.axisLabel })}
          </div>
          {data.tracks.map((tr, i) => (
            <div className="track" key={i}>
              <span className="track-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="track-body">
                <div className="track-titleRow">
                  <span className="track-title">{tr.title}</span>
                  <span className="track-scene">{tr.scene}</span>
                </div>
                <div className="track-prompt">{tr.prompt}</div>
              </div>
              <CopyBtn text={trackSuno(tr)} label="Suno" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AlbumConsole, AlbumCard });
