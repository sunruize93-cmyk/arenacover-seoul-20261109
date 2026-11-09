# ArenaCover English launch film

75 seconds · 1920×1080 · 30fps. Open `index.html` through HyperFrames; individual scenes are in `compositions/`.

```bash
npm run dev
npm run check
npm run render -- --quality delivery -o ../delivery/ArenaCover_Demo75s.mp4
```

Requires Node 22+, FFmpeg and ffprobe on PATH. Preview is editable in the HyperFrames desktop app. Original browser source `assets/demo.webm` shows actual local-chain execution; the four confirmed transaction receipts are in `../public/evidence/run.json`.

Titles and key figures use Bebas Neue for a heavier, more readable condensed style. All font licenses are in assets/fonts. Chrome shield is original generated artwork. English narration uses macOS Samantha synthesized speech. Audio files are frozen locally for reproducible rendering.

Music: **'Pursuit' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au**. Source/license: https://www.scottbuckley.com.au/library/pursuit/. Include this exact credit in the description of any YouTube upload. Excerpt starts 78 seconds into the track, ducked to 0.23 under narration and lifted to 0.50 in gaps, with a 1.5s fade-out.

Current proof is local EVM chain 31337. Injective EVM Testnet 1439 is the deployment target; no public deployment is claimed. TEE is not connected.

The camera wrapper adapts the anchoring approach of HyperFrames `ui-focus-zoom`; the original registry component is retained in compositions/components for reference.

Published YouTube film (unlisted,viewable with link): https://youtu.be/0WrEHcNbB64
