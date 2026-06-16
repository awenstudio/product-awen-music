/* Awen Study — Matrix data, brand defaults, reference sample, fallback prompt engine.
   Plain script: exposes window.AWEN. No build step. */
(function () {
  const DIMS = [
    {
      key: 'environment', label: 'Environment', zh: '环境', code: 'ENV', layer: 'content',
      options: ['Library', 'Rainy Window', 'Cozy Desk', 'Forest Cabin', 'Ocean View',
                'Kyoto Study Room', 'Space Station', 'Night City', 'Mountain Lodge', 'Quiet Café'],
    },
    {
      key: 'nature', label: 'Nature', zh: '自然', code: 'NAT', layer: 'content',
      options: ['Rain', 'Light Snow', 'Soft Wind', 'Ocean Waves', 'Birdsong',
                'Fireplace', 'Distant Thunder', 'Forest Stream', 'Rustling Leaves', 'None'],
    },
    {
      key: 'time', label: 'Time', zh: '时间', code: 'TIME', layer: 'content',
      options: ['Dawn', 'Early Morning', 'Afternoon', 'Golden Hour', 'Dusk',
                'Evening', 'Night', 'Midnight', '3 AM'],
    },
    {
      key: 'mood', label: 'Mood', zh: '情绪', code: 'MOOD', layer: 'content',
      options: ['Calm', 'Cozy', 'Warm', 'Nostalgic', 'Bittersweet',
                'Hopeful', 'Dreamy', 'Focused', 'Lonely'],
    },
    {
      key: 'instrument', label: 'Instrument', zh: '乐器', code: 'INST', layer: 'content',
      options: ['Felt Piano', 'Grand Piano', 'Warm Pad', 'Strings', 'Rhodes',
                'Acoustic Guitar', 'Music Box', 'Vibraphone', 'Cello', 'Harp'],
    },
    {
      key: 'style', label: 'Style', zh: '风格', code: 'STY', layer: 'production',
      options: ['Ambient', 'Neo Classical', 'Lo-fi Hip Hop', 'Chillhop', 'Jazzhop',
                'Minimal Piano', 'Drone Ambient', 'Slowcore'],
    },
  ];

  const BPM = { key: 'bpm', label: 'BPM', code: 'BPM', layer: 'production',
                values: [55, 58, 60, 62, 65, 68, 70] };

  // Brand-fixed recommendations from the master plan (Calm / Cozy / Warm · Ambient · Felt Piano · 55-70).
  const DEFAULTS = {
    environment: 'Library', nature: 'Rain', time: 'Night',
    mood: 'Calm', instrument: 'Felt Piano', style: 'Ambient', bpm: 60,
  };

  // Imported mainstream lo-fi sample — represented abstractly, only used to seed decompose defaults.
  const REFERENCE = {
    source: 'Spotify', id: '3q7MJsEXF5aDhjOPx8nbaI',
    label: 'Imported reference', sub: 'mainstream lo-fi sample · decomposed',
    decomposed: {
      environment: 'Rainy Window', nature: 'Rain', time: 'Night',
      mood: 'Calm', instrument: 'Felt Piano', style: 'Lo-fi Hip Hop', bpm: 62,
    },
  };

  const CONTENT_KEYS = ['environment', 'nature', 'time', 'mood', 'instrument'];

  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function randomSelection() {
    const s = {};
    DIMS.forEach(d => { s[d.key] = rand(d.options); });
    s.bpm = rand(BPM.values);
    return s;
  }

  // Count how many dimensions differ from the reference baseline.
  function mutations(sel) {
    let n = 0;
    Object.keys(REFERENCE.decomposed).forEach(k => {
      if (sel[k] !== REFERENCE.decomposed[k]) n++;
    });
    return n;
  }

  // Production/texture tag layer — the part Suno actually responds to.
  // Beat-driven styles get drums + swing; ambient/piano styles stay drumless and airy.
  const BEAT_STYLES = ['Lo-fi Hip Hop', 'Chillhop', 'Jazzhop'];
  function textureTags(style) {
    return BEAT_STYLES.includes(style)
      ? 'soft brushed drums, gentle swing, warm tape saturation, vinyl crackle, sidechained pad, mellow'
      : 'no drums, warm tape saturation, soft room reverb, low-pass filter, airy, intimate';
  }

  // Deterministic fallback prompt engine (used when the AI call fails).
  function fallbackPrompt(s) {
    const natureClause = s.nature === 'None' ? '' : `, ${s.nature.toLowerCase()} ambience`;
    const sceneLight = s.nature === 'None' ? 'soft warm light' : `${s.nature.toLowerCase()} in the scene`;
    const place = s.environment.toLowerCase();
    const titleWords = {
      'Rainy Window': 'Rain on the Glass', 'Library': 'Quiet in the Stacks',
      'Cozy Desk': 'Desk Lamp Hours', 'Forest Cabin': 'Cabin in the Pines',
      'Ocean View': 'Tide Line', 'Kyoto Study Room': 'Paper Screens',
      'Space Station': 'Low Orbit', 'Night City': 'After the Last Train',
      'Mountain Lodge': 'Above the Treeline', 'Quiet Café': 'Corner Table',
    };
    const title = titleWords[s.environment] || `${s.environment} ${s.time}`;
    return {
      title,
      tagline: `${s.mood.toLowerCase()} · ${s.time.toLowerCase()}`,
      suno: {
        style: `${s.style}, ${s.mood.toLowerCase()} lo-fi, ${s.instrument.toLowerCase()}, ${s.bpm} bpm, ${textureTags(s.style)}, instrumental`,
        prompt: `Instrumental ${s.style.toLowerCase()} led by ${s.instrument.toLowerCase()}${natureClause}, ${s.mood.toLowerCase()} and study-friendly.`,
        exclude: 'vocals, lyrics, harsh percussion, sudden dynamics',
      },
      cover: `Square 1:1 album cover: a ${place} at ${s.time.toLowerCase()}, ${s.mood.toLowerCase()} mood, ${sceneLight}. Centered composition with calm negative space near the top for a title, soft warm light, painterly film grain. No text, no motion.`,
      video: `16:9 looping background: a ${place} at ${s.time.toLowerCase()}, ${s.mood.toLowerCase()} and still, ${sceneLight}. Very slow cinematic camera drift, shallow depth of field, gentle film grain, seamless loop.`,
    };
  }

  /* ============================ ALBUM ENGINE ============================
     An album = a FIXED sonic identity (the base recipe) + ONE traversal axis
     that progresses across tracks. Only the axis's "moving" dimension(s) change
     track-to-track; everything else is held constant. That is what makes a set
     of tracks read as a single album instead of a playlist. */

  const ENV_JOURNEY = ['Quiet Café', 'Library', 'Cozy Desk', 'Rainy Window', 'Forest Cabin',
                       'Mountain Lodge', 'Ocean View', 'Kyoto Study Room', 'Night City', 'Space Station'];
  const NATURE_SEASON = ['Birdsong', 'Rustling Leaves', 'Soft Wind', 'Forest Stream', 'Ocean Waves',
                         'Rain', 'Distant Thunder', 'Light Snow', 'Fireplace'];
  const MOOD_ARC = ['Hopeful', 'Warm', 'Cozy', 'Calm', 'Dreamy', 'Nostalgic', 'Bittersweet', 'Lonely'];
  const MOOD_HEAL = ['Lonely', 'Bittersweet', 'Nostalgic', 'Calm', 'Warm', 'Hopeful'];
  const TIME_ARC = ['Dawn', 'Early Morning', 'Afternoon', 'Golden Hour', 'Dusk', 'Evening', 'Night', 'Midnight', '3 AM'];
  const TIME_MORNING = ['Dawn', 'Early Morning', 'Afternoon', 'Golden Hour'];
  const TIME_LATE = ['Evening', 'Night', 'Midnight', '3 AM'];
  const STORM_FRONT = ['Soft Wind', 'Rain', 'Distant Thunder', 'Rain', 'Forest Stream', 'Birdsong'];

  const ALBUM_AXES = [
    { key: 'day',    label: 'Day Arc',          moves: ['time'],
      zh: '时间从清晨走到午夜，一天的完整弧线（最经典）',
      en: 'Time walks from dawn to midnight — a full day arc (classic).', seq: { time: TIME_ARC } },
    { key: 'place',  label: 'Place Journey',    moves: ['environment'],
      zh: '镜头穿过一连串场景空间，像一段漫游',
      en: 'The camera moves through a series of spaces, like a journey.', seq: { environment: ENV_JOURNEY } },
    { key: 'season', label: 'Seasons Turning',  moves: ['nature'],
      zh: '环境氛围从生机流转到深冬',
      en: 'Ambience turns from fresh spring to deep winter.', seq: { nature: NATURE_SEASON } },
    { key: 'morning', label: 'Morning Rise',    moves: ['time', 'bpm', 'mood'], gen: 'morning',
      zh: '清晨到午后，节奏渐快、情绪转向专注——学习开场',
      en: 'Dawn to afternoon: tempo lifts, mood turns toward focus — a study warm-up.' },
    { key: 'focus',  label: 'Focus Session',    moves: ['bpm', 'mood'], gen: 'focus',
      zh: '节奏先升后落、中段进入专注——贴合一次真实学习时段',
      en: 'Tempo rises then falls, focus peaks mid-set — one real study session.' },
    { key: 'latenight', label: 'Late-Night Descent', moves: ['time', 'bpm', 'mood'], gen: 'latenight',
      zh: '黄昏到凌晨三点，节奏渐慢、情绪向内下沉（深夜/失眠）',
      en: 'Evening to 3 AM: tempo slows, mood sinks inward (late night / insomnia).' },
    { key: 'storm',  label: 'Storm Passing',    moves: ['nature', 'mood'], gen: 'storm',
      zh: '一场雨从微风酰酿、到雷雨、再到放晴',
      en: 'One rainstorm: from breeze, to thunder, to clearing skies.' },
    { key: 'mood',   label: 'Mood Drift',       moves: ['mood'],
      zh: '情绪从明亮沿一条曲线渐渐向内漂移',
      en: 'Emotion drifts along a curve from bright to inward.', seq: { mood: MOOD_ARC } },
    { key: 'comfort', label: 'Comfort Arc',     moves: ['mood'],
      zh: '情绪从孤独/苦涩 → 平静 → 温暖，一条向上的修复曲线',
      en: 'From lonely / bittersweet → calm → warm: an upward, healing curve.', seq: { mood: MOOD_HEAL } },
    { key: 'ep',     label: 'Concept EP',       moves: ['nature', 'time'], gen: 'ep', maxTracks: 5,
      zh: '几乎全锁、只做细微变奏（EP 形态，自动限 5 首内）',
      en: 'Almost fully locked, tiny variations only (EP form, capped at 5).' },
  ];

  function sampleSeq(arr, n) {
    if (n <= 1) return [arr[0]];
    const out = [];
    for (let i = 0; i < n; i++) out.push(arr[Math.round(i * (arr.length - 1) / (n - 1))]);
    return out;
  }
  function nearest(arr, target) {
    return arr.reduce((best, v) => Math.abs(v - target) < Math.abs(best - target) ? v : best, arr[0]);
  }
  function rampBpm(n, from, to) {
    const out = [];
    for (let i = 0; i < n; i++) { const p = n > 1 ? i / (n - 1) : 0; out.push(nearest(BPM.values, from + (to - from) * p)); }
    return out;
  }

  // Returns { axis, recipes:[selection…] }. recipes.length === effective track count.
  function buildAlbum(axisKey, base, count) {
    const axis = ALBUM_AXES.find(a => a.key === axisKey) || ALBUM_AXES[0];
    const n = Math.max(3, Math.min(count, axis.maxTracks || count));
    const recipes = [];
    const mk = (over) => Object.assign({}, base, over);

    if (axis.gen === 'focus') { // BPM rises then falls, mood deepens mid-set
      for (let i = 0; i < n; i++) {
        const pos = n > 1 ? i / (n - 1) : 0;
        const tri = 1 - Math.abs(0.5 - pos) * 2;
        recipes.push(mk({ bpm: nearest(BPM.values, 55 + tri * (68 - 55)),
                          mood: (pos > 0.28 && pos < 0.72) ? 'Focused' : base.mood }));
      }
    } else if (axis.gen === 'morning') { // dawn→afternoon, energy rising, hopeful→focused
      const tseq = sampleSeq(TIME_MORNING, n), bseq = rampBpm(n, 55, 68);
      for (let i = 0; i < n; i++) {
        const pos = n > 1 ? i / (n - 1) : 0;
        recipes.push(mk({ time: tseq[i], bpm: bseq[i], mood: pos < 0.5 ? 'Hopeful' : 'Focused' }));
      }
    } else if (axis.gen === 'latenight') { // evening→3am, slowing, drifting inward
      const tseq = sampleSeq(TIME_LATE, n), bseq = rampBpm(n, 65, 55),
            mseq = sampleSeq(['Calm', 'Dreamy', 'Nostalgic', 'Lonely'], n);
      for (let i = 0; i < n; i++) recipes.push(mk({ time: tseq[i], bpm: bseq[i], mood: mseq[i] }));
    } else if (axis.gen === 'storm') { // weather front building then clearing
      const nseq = sampleSeq(STORM_FRONT, n);
      for (let i = 0; i < n; i++) {
        const pos = n > 1 ? i / (n - 1) : 0;
        recipes.push(mk({ nature: nseq[i], mood: (pos > 0.3 && pos < 0.6) ? 'Bittersweet' : base.mood }));
      }
    } else if (axis.gen === 'ep') { // near-static micro-variation
      const nseq = sampleSeq(NATURE_SEASON.slice(4), n), tseq = sampleSeq(TIME_LATE, n);
      for (let i = 0; i < n; i++) recipes.push(mk({ nature: nseq[i], time: tseq[i] }));
    } else { // single-dimension sequence (day / place / season / mood / comfort)
      const dim = axis.moves[0], seq = sampleSeq(axis.seq[dim], n);
      for (let i = 0; i < n; i++) recipes.push(mk({ [dim]: seq[i] }));
    }
    return { axis, recipes };
  }

  // Which dims are held constant (the "anchor") for a given axis.
  function anchorDims(axisKey) {
    const axis = ALBUM_AXES.find(a => a.key === axisKey) || ALBUM_AXES[0];
    const moving = new Set(axis.moves);
    return ['style', 'instrument', 'environment', 'nature', 'time', 'mood', 'bpm']
      .filter(k => !moving.has(k));
  }

  // Offline album fallback (used when AI is off/fails). Includes liner-note description.
  function fallbackAlbum(axisKey, base, recipes) {
    const axis = ALBUM_AXES.find(a => a.key === axisKey) || ALBUM_AXES[0];
    const titles = {
      day: 'Hours', place: 'Passages', season: 'Turning', focus: 'Deep Work',
      mood: 'Undercurrents', comfort: 'Coming Home', morning: 'First Light',
      latenight: 'Small Hours', storm: 'The Passing Rain', ep: 'Quiet Set',
    };
    const albumTitle = `${base.environment} ${titles[axisKey] || 'Sessions'}`;
    const anchor = `${base.style}, ${base.mood.toLowerCase()} lo-fi, ${base.instrument.toLowerCase()}, ${base.bpm} bpm range, ${textureTags(base.style)}, instrumental`;
    const tracks = recipes.map((s) => {
      const moveLabels = axis.moves.map(k => k === 'bpm' ? s.bpm + ' bpm' : s[k]).join(' · ');
      return {
        title: `${moveLabels}`,
        scene: `${s.time} · ${s.environment}`,
        prompt: `${axis.moves.includes('bpm') ? s.bpm + ' bpm, ' : ''}${s.mood.toLowerCase()} ${s.style.toLowerCase()} in a ${s.environment.toLowerCase()} at ${s.time.toLowerCase()}${s.nature === 'None' ? '' : ', ' + s.nature.toLowerCase() + ' ambience'}.`,
      };
    });
    const firstT = recipes[0], lastT = recipes[recipes.length - 1];
    const description =
      `Built from a single ${base.instrument.toLowerCase()} identity recorded in a ${base.environment.toLowerCase()}, ` +
      `${recipes.length} instrumental tracks follow one ${axis.label.toLowerCase()}. ` +
      `It opens with “${tracks[0].title}” and closes on “${tracks[tracks.length - 1].title}”, ` +
      `holding the same warm tape texture and ${base.bpm} bpm pulse throughout — made for long, uninterrupted study.`;
    const descriptionZh =
      `以一段在 ${base.environment} 里的 ${base.instrument} 为核心，${recipes.length} 首纯器乐沿着「${axis.label}」展开，` +
      `从「${tracks[0].title}」开始，在「${tracks[tracks.length - 1].title}」收束，` +
      `全程维持同样温暖的磁带质感与 ${base.bpm} 左右的脉动——为长时间不被打断的学习而作。`;
    return {
      album: albumTitle,
      concept: `${recipes.length} instrumental tracks · ${axis.label.toLowerCase()} · one ${base.instrument.toLowerCase()} identity held throughout`,
      description,
      descriptionZh,
      anchor,
      cover: `Square 1:1 cover for "${albumTitle}": a ${base.environment.toLowerCase()} at ${base.time.toLowerCase()}, ${base.mood.toLowerCase()} mood, soft cinematic light, painterly film grain. Centered composition with negative space near the top for the album title. No text, no motion.`,
      video: `16:9 looping background video for "${albumTitle}": a ${base.environment.toLowerCase()} at ${base.time.toLowerCase()}, ${base.mood.toLowerCase()} and still, very slow cinematic camera drift, shallow depth of field, gentle film grain, seamless loop.`,
      tracks,
    };
  }

  window.AWEN = {
    DIMS, BPM, DEFAULTS, REFERENCE, CONTENT_KEYS,
    randomSelection, mutations, fallbackPrompt, rand,
    ALBUM_AXES, buildAlbum, anchorDims, fallbackAlbum,
  };
})();
