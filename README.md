# Awen Music — Matrix Generator

> **V2.2** — Musical Coherence Engine + Track Role Signatures

[English](#english) | [中文](#中文)

**Live:** [hiawen.com/music](https://hiawen.com/music/) · **Deploy repo:** [awenstudio.github.io](https://github.com/awenstudio/awenstudio.github.io)

---

<a id="中文"></a>

## 中文

一个 **lo-fi 学习音乐的 Prompt 工厂**。在 11 维度矩阵上配好"声音配方"，自动生成 Suno 风格框、编曲结构、封面/视频 prompt、YouTube 元数据、文件命名——从灵感到发布，一站式完成。

### 核心功能

- **11 维度矩阵** — 声音 7 维（环境 · 自然 · 时间 · 情绪 · 乐器 · 风格 · BPM）+ 视觉 4 维（角色 · 光线 · 色板 · 叙事母题）
- **4 种模式** — Pick 手选 · Shuffle 随机 · Decompose 反推 · Album 专辑
- **Musical Coherence Engine** — 自动生成调性、精炼风格框、5 段编曲结构（metatag 格式）
- **Track Role Signatures** — 每首歌在专辑中有独立角色和记忆点
- **Universe Builder** — 保存视觉身份，跨专辑复用
- **一键复制** — Suno 三框、封面 prompt、视频 prompt、YouTube 元数据、文件命名
- **AI + 离线双引擎** — AI 不可用时自动切换模板引擎，所有功能可用
- **8 种语言** — 中 · 英 · 日 · 韩 · 法 · 西 · 德 · 葡
- **4 套主题** — Console（深色）· Lo-fi（暖棕）· Clean（浅色）· Studio（中性深）

### 本地运行

无需安装，直接启动：

```bash
python3 -m http.server 8000 --directory docs
# 打开 http://localhost:8000
```

### AI 后端

- **Cloudflare Worker：** `workers/generate.js`（万能 AI 代理，支持 OpenAI / Anthropic / DeepSeek / MiMo 等）
- **认证：** 用户通过弹窗输入访问密码，存在 `localStorage`
- **离线降级：** AI 不可用时自动使用内置模板引擎

### 项目结构

```
awen-music/
├── docs/index.html              ← 完整构建（V2.2，与线上同步）
├── src/                         ← 拆分源码（V2.0 基础版）
│   ├── data.js                  矩阵数据 + prompt 引擎
│   ├── i18n.js                  多语言字符串
│   ├── components.jsx           通用组件
│   ├── cards.jsx                单曲卡片
│   ├── album.jsx                专辑控制台
│   ├── guide.jsx                首次使用引导
│   ├── tweaks-panel.jsx         设置面板
│   └── app.jsx                  App 根组件
├── workers/generate.js          ← Cloudflare Worker
├── CHANGELOG.md                 版本变更记录
├── FIX_LOG.md                   Bug 修复日志 + 代码规范
└── SUNO_BEST_PRACTICES.md       Suno 使用指南
```

> `src/` 目前是 V2.0 版本。V2.1/V2.2 的新功能直接在 `docs/index.html` 单文件中开发。后续计划回迁到拆分源码。

### 版本历史

| 版本 | 主要变更 |
|---|---|
| **V2.2** | Musical Coherence Engine · Track Role Signatures · 增强 SongCard/AlbumCard |
| **V2.1** | 健壮性修复：safeLS · AbortController 超时 · TokenModal · Toast 通知 |
| **V2.0** | Universe Engine：11 维矩阵 · 视觉身份 · 专辑 DNA · 元数据生成 · Smart Decompose |
| **V1.0** | 7 维矩阵 · 4 模式 · 8 预设 · 离线引擎 |

---

<a id="english"></a>

## English

A **lo-fi study music prompt factory**. Configure a "sound recipe" on an 11-dimension matrix, then auto-generate Suno style boxes, arrangement structures, cover/video prompts, YouTube metadata, and file naming — end-to-end from inspiration to publish.

### Key Features

- **11-dimension matrix** — 7 sonic (Environment · Nature · Time · Mood · Instrument · Style · BPM) + 4 visual (Character · Light · Palette · Motif)
- **4 modes** — Pick · Shuffle · Decompose · Album
- **Musical Coherence Engine** — auto-generate musical key, refined style boxes, 5-segment arrangement structures (metatag format)
- **Track Role Signatures** — each song gets a unique role and signature element within an album
- **Universe Builder** — save and reuse visual identities across albums
- **One-click copy** — Suno three-box, cover prompt, video prompt, YouTube metadata, file naming
- **AI + offline dual engine** — graceful fallback to template engine when AI is unavailable
- **8 languages** — ZH · EN · JA · KO · FR · ES · DE · PT
- **4 themes** — Console (dark) · Lo-fi (warm) · Clean (light) · Studio (neutral dark)

### Run Locally

No install needed:

```bash
python3 -m http.server 8000 --directory docs
# open http://localhost:8000
```

### AI Backend

- **Cloudflare Worker:** `workers/generate.js` (universal AI proxy — OpenAI / Anthropic / DeepSeek / MiMo compatible)
- **Auth:** user enters access password via modal, stored in `localStorage`
- **Offline fallback:** built-in template engine activates automatically when AI is unavailable

### Project Structure

```
awen-music/
├── docs/index.html              ← self-contained build (V2.2, synced with live)
├── src/                         ← split source files (V2.0 base)
│   ├── data.js                  matrix data + prompt engine
│   ├── i18n.js                  i18n strings
│   ├── components.jsx           shared components
│   ├── cards.jsx                song cards
│   ├── album.jsx                album console
│   ├── guide.jsx                first-run guide
│   ├── tweaks-panel.jsx         settings panel
│   └── app.jsx                  App root component
├── workers/generate.js          ← Cloudflare Worker
├── CHANGELOG.md                 release notes
├── FIX_LOG.md                   bug history + code rules
└── SUNO_BEST_PRACTICES.md       Suno usage guide
```

> `src/` is at V2.0 level. V2.1/V2.2 features were developed directly in the single-file `docs/index.html`. Back-porting to split source files is a future task.

### Version History

| Version | Key Changes |
|---|---|
| **V2.2** | Musical Coherence Engine · Track Role Signatures · Enhanced SongCard/AlbumCard |
| **V2.1** | Robustness: safeLS · AbortController timeout · TokenModal · Toast notifications |
| **V2.0** | Universe Engine: 11-dim matrix · Visual identity · Album DNA · Metadata gen · Smart Decompose |
| **V1.0** | 7-dim matrix · 4 modes · 8 presets · Offline engine |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). For anything larger than a small fix, open an issue first.

## License

[MIT](LICENSE) © Awen Studio
