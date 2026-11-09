# ArenaCover English launch film

60 seconds · 1920×1080 · 30fps. Open `index.html` through HyperFrames; individual scenes are in `compositions/`.

```bash
npm run dev
npm run check
npm run render -- --quality delivery -o ../delivery/ArenaCover_Demo60s.mp4
```

Requires Node 22+, FFmpeg and ffprobe on PATH. Preview is editable in the HyperFrames desktop app. Original browser source `assets/demo.webm` shows actual local-chain execution; the four confirmed transaction receipts are in `../public/evidence/run.json`.

Titles and key figures use Bebas Neue for a heavier, more readable condensed style. All font licenses are in assets/fonts. Chrome shield is original generated artwork. English narration uses macOS Samantha synthesized speech. Audio files are frozen locally for reproducible rendering.

Music: **'Neon' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au**. Source/license: https://www.scottbuckley.com.au/library/neon/. Include this exact credit in the description of any YouTube upload. Excerpt starts 99 seconds into the track, mixed at 0.19 volume.

Current proof is local EVM chain 31337. Injective EVM Testnet 1439 is the deployment target; no public deployment is claimed. TEE is not connected.

The camera wrapper adapts the anchoring approach of HyperFrames `ui-focus-zoom`; the original registry component is retained in compositions/components for reference.
