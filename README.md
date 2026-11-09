# ArenaCover

[English](./README.md) · [한국어](./README.ko.md) · [中文](./README.zh-CN.md)

[![ArenaCover — Who pays?](./public/assets/film-poster.jpg)](https://youtu.be/0WrEHcNbB64)

**[Live demo](https://arenacover-seoul-20261109.vercel.app) · [75-second English film](https://youtu.be/0WrEHcNbB64)**

> **Built for Injective EVM Testnet (chain 1439).** The current recorded proof runs on local EVM chain 31337. Testnet deployment tooling is ready; public testnet deployment has not been completed.

**Autonomy needs accountability.** A prefunded execution guarantee for agent payments, built for c0mpiled Seoul on November 9, 2026.

A fixed business order permits one 10 DemoUSD payment. An explicit fault harness charges it twice; the guarantee checks confirmed contract state and compensates the extra 10 from the operator’s prefunded reserve.

## Why this matters

Agents can execute payments. Someone still has to own an execution failure. ArenaCover turns a narrow responsibility promise into a funded, deterministic payout: agree the limit, reserve capital, verify the excess, compensate once. Arena402 is the first intended integration target.

## Run locally

Requires Node.js 22 or newer. No personal wallet, real assets, database, or external API key is needed for the local sandbox.

1. Run `npm ci` and `npm run compile:contracts`.
2. In one terminal run `npm run chain` (localhost only, chain 31337).
3. In a second terminal run `npm run deploy:local`.
4. Run `npm run dev` and open [the local app](http://127.0.0.1:3000).
5. Connect the sandbox wallet, protect the trade, run the controlled fault, and verify compensation.

The sandbox uses a publicly known development mnemonic, and signing is fenced to a localhost webpage, localhost RPC and chain 31337. Never fund these development accounts on public networks. Testnet deployment uses separately generated wallets stored only in the ignored `.local` directory.

Each deployment supports one order. Run `npm run deploy:local` to prepare another; existing chain records are preserved.

## Verify

- `npm test` — six contract behavior tests and three signing-network fence tests.
- `npm run typecheck` and `npm run build` — frontend checks.
- `node scripts/browser-check.mjs` — exercises a fresh local deployment in Chromium; writes confirmed receipts and screenshots. Install Chromium with `npx playwright install chromium` first.
- `node scripts/recovery-check.mjs` — verifies that a reload recovers a confirmed payout receipt before clearing pending state.
- `npm run scenario` — terminal execution of a fresh deployment, with machine-readable evidence.
- `node scripts/record-demo.mjs` then `node scripts/render-demo.mjs` — records a fresh deployment for 75 seconds and adds disclosed macOS synthesized English narration. The renderer requires the local Python package imageio-ffmpeg.

[Verification record](./VERIFICATION.md) · [Confirmed run JSON](./public/evidence/run.json) · [TEE check result](./TEE_CHECK_RESULT.md)

## Testnet deployment

`npm run deploy:testnet` prepares separate local testnet wallets and prints only their addresses. Fund the operator through the [official Injective testnet faucet](https://testnet.faucet.injective.network/) and rerun the command. It checks chain 1439, deploys two contracts, seeds test tokens, and funds the user’s test gas. Existing deployment credentials can instead be supplied in an untracked `.env.local`; see `.env.example`. Never commit secrets.

This is deployment tooling, not evidence that testnet deployment completed. Check the active `public/deployment.json` and verification record for actual network status.

## Historical Arena402 testnet wallets

Network: **Injective EVM Testnet · chain ID 1439**.

| Role | Address | Historical use |
| --- | --- | --- |
| Facilitator | `0x7fB8d49698E40656F727511Da6251D3e6dfFaD50` | Faucet recipient, contract deployment and gas payer |
| Seller | `0x93Dafa6bFa2428CA033e8d6Fe9C94e40d1AC8754` | Seller payment recipient in trading tests |

Source: historical `agent-arena/settlement/deployments.json` (Facilitator reference: line 19), reconfirmed by the owner. Balances were **not re-queried for this update**. These are wallet references; active ArenaCover deployment metadata remains in [`public/deployment.json`](./public/deployment.json).

[Machine-readable address record](./docs/arena402-historical-testnet-wallets.json) · [Earlier balance snapshot and resource notes](./RESOURCE_STATUS.md)

## Guarantee terms

| Item | Fixed demo term |
| --- | --- |
| Initial user balance | 100 DemoUSD |
| Operator capital | 100 DemoUSD |
| Premium | 1 DemoUSD |
| Authorized payment | 10 DemoUSD, once |
| Duplicate payment | A second distinct payment for the same order |
| Maximum compensation | 10 DemoUSD, once |
| Final user / pool | 89 / 90 DemoUSD |

Market losses, strategy performance, gas, refunds, expiry, capital withdrawal and multi-order underwriting are outside this prototype. Execution and guarantee share one demo contract; this is not an independent external-agent oracle or a licensed insurance product. No TEE verification is connected and no x402 settlement is claimed.

## Arena402 relationship and provenance

Arena402 is the intended first integration target. The original frontend settlement-stage and ledger evidence designs informed the flow; this project was created as a fresh repository, not a fork. No old production backend, wallet secret store, authentication or game API is copied into this application.

References: [Arena frontend](https://github.com/Adkid-Zephyr/arena402/tree/ce0edbe6791bfde182ac0482505fe9f8b565a032), [referenced backend](https://github.com/13-pieces-teen/adx_agentic_payment). ERC20 and safety helpers are supplied by OpenZeppelin through npm, under their bundled license.

## Planning and delivery

[PRD](./PRD.md) · [Development checklist](./DEVELOPMENT_TASKS.md) · [TEE readiness checklist](./TEE_PRECHECK.md) · [75-second storyboard](./DEMO_90S.md) · [Original planning entry](./PLANNING_README.md)

Recorded local-chain evidence may be displayed on a hosted read-only replay. It must stay labelled as a local recorded run and does not imply Injective testnet settlement.

## Visual design and film

The frontend adapts the cobalt palette, condensed typography and editorial spacing of [Hermes Agent](https://hermes-agent.nousresearch.com), using the user-requested [clone-any-website skill](https://github.com/promptwhisper/clone-any-website-skill). The shield is original generated artwork; fonts are locally bundled Barlow Condensed and IBM Plex Mono under SIL OFL. No Hermes logo, commercial trial fonts, compiled source bundle or analytics is reused. This is an intentional brand adaptation, not a pixel-identical replica.

Film music: **'Pursuit' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au**. [Track and license](https://www.scottbuckley.com.au/library/pursuit/). Include this credit in any YouTube upload description. Voice: disclosed synthesized English narration.

Editable launch-film source: [`video/`](./video/README.md).
