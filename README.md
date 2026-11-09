# ArenaCover

**Autonomy needs accountability.** A prefunded execution guarantee for agent payments, built for c0mpiled Seoul on November 9, 2026.

A fixed business order permits one 10 DemoUSD payment. An explicit fault harness charges it twice; the guarantee checks confirmed contract state and compensates the extra 10 from the operator’s prefunded reserve.

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

- `npm test` — six contract behavior tests.
- `npm run typecheck` and `npm run build` — frontend checks.
- `node scripts/browser-check.mjs` — exercises a fresh local deployment in Chromium; writes confirmed receipts and screenshots. Install Chromium with `npx playwright install chromium` first.
- `npm run scenario` — terminal execution of a fresh deployment, with machine-readable evidence.

[Verification record](./VERIFICATION.md) · [Confirmed run JSON](./public/evidence/run.json) · [TEE check result](./TEE_CHECK_RESULT.md)

## Testnet deployment

`npm run deploy:testnet` prepares separate local testnet wallets and prints only their addresses. Fund the operator through the [official Injective testnet faucet](https://testnet.faucet.injective.network/) and rerun the command. It checks chain 1439, deploys two contracts, seeds test tokens, and funds the user’s test gas. Existing deployment credentials can instead be supplied in an untracked `.env.local`; see `.env.example`. Never commit secrets.

This is deployment tooling, not evidence that testnet deployment completed. Check the active `public/deployment.json` and verification record for actual network status.

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

[PRD](./PRD.md) · [Development checklist](./DEVELOPMENT_TASKS.md) · [TEE readiness checklist](./TEE_PRECHECK.md) · [90-second storyboard](./DEMO_90S.md) · [Original planning entry](./PLANNING_README.md)

Recorded local-chain evidence may be displayed on a hosted read-only replay. It must stay labelled as a local recorded run and does not imply Injective testnet settlement.
