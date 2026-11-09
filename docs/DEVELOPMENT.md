# Development guide

Requires Node.js **22+**. The interactive sandbox needs no personal wallet, real assets or external API key.

## Run the interactive demo

```bash
npm ci
npm run compile:contracts
npm run chain
```

Leave the chain running. In another terminal:

```bash
npm run deploy:local
npm run dev
```

Open http://127.0.0.1:3000. Connect the sandbox wallet → protect the trade → run the controlled fault → verify and compensate.

The local deployment writes `public/deployment.json`. Each deployment supports one order. `npm run deploy:local` prepares a new order; it preserves previous on-chain records but replaces the active deployment file. Sandbox accounts use a publicly known development mnemonic and must remain unfunded on public networks.

## Checks

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions uses Node.js 22, compiles contracts, checks that committed ABIs match, runs all nine behavior/signing-fence tests, type checks and builds the production frontend. The suite uses an in-process local EVM and requires no testnet funding or secrets.

### Browser verification

With the local chain and app running, prepare a fresh order and run:

```bash
npx playwright install chromium
npm run deploy:local
node scripts/browser-check.mjs
```

This consumes the order, records four successful transaction receipts and checks final balances and mobile overflow. It writes `test-results/` plus `public/evidence/run.json`. New evidence must stay paired with its matching `public/deployment.json`.

After a completed run:

```bash
node scripts/recovery-check.mjs
```

This checks pending confirmed-payout recovery and receipt persistence.

### Terminal execution

```bash
npm run deploy:local
npm run scenario
```

The scenario consumes a fresh order and writes its evidence. It refuses remote RPCs in local mode and rejects mainnet chain IDs in the testnet path before loading testnet key material.

## Injective EVM Testnet

Target: **chain 1439**. This path is implemented but has not produced the published demo evidence.

```bash
npm run deploy:testnet
```

The script prepares separate generated testnet wallets in ignored `.local/` files and prints public addresses. Fund the generated operator with testnet INJ using the official faucet, then rerun. The script checks the chain, deploys both contracts, seeds DemoUSD and transfers test gas to the fixed demo user.

Optional configuration goes in untracked `.env.local`; see [`.env.example`](../.env.example):

```dotenv
INJECTIVE_RPC_URL=https://k8s.testnet.json-rpc.injective.network/
DEPLOYER_PRIVATE_KEY=
```

Use a dedicated testnet key if configuring one. Keys and `.local/` contents must never be committed. The frontend's testnet branch uses an injected wallet and checks the chain and fixed beneficiary before writes.

[Historical Arena402 addresses](./arena402-historical-testnet-wallets.json) are references only; the script does not automatically import old wallet credentials. [TEE precheck result](../TEE_CHECK_RESULT.md) remains NO_GO.

## Record and render

The two video commands serve different purposes:

| Command | Output |
| --- | --- |
| `npm run record:demo` | **90-second raw browser source**, from a fresh deployed order; also writes confirmed evidence |
| `npm run render:demo` | Legacy raw-recording narration renderer; **90-second** first-cut workflow |
| `npm run render:cinematic` | Current editable HyperFrames composition; **75-second** delivery MP4 |

The current 75-second film is an edited composition with its own timing; the raw recording's 90-second length is intentional. See [`video/README.md`](../video/README.md). HyperFrames rendering needs FFmpeg and ffprobe on PATH. The legacy renderer uses macOS `say` and Python `imageio-ffmpeg`.

## File map

| Path | Purpose |
| --- | --- |
| `contracts/ArenaCover.sol` | Both Solidity contracts |
| `src/app/page.tsx` | Interactive/replay UI |
| `src/app/globals.css` | Product visual system |
| `src/lib/abi.json` | Generated, committed frontend ABIs |
| `scripts/compile.mjs` | solc-js compilation, Paris EVM target |
| `scripts/deploy.mjs` | Local/testnet deployment and funding |
| `scripts/scenario.mjs` | Script-driven fixed-order execution |
| `tests/` | Contract and signing-fence tests |
| `public/evidence/run.json` | Recorded confirmed run |
| `video/` | Editable75-second film, frozen media and credits |

[Architecture](./ARCHITECTURE.md) · [Verification history](../VERIFICATION.md).
