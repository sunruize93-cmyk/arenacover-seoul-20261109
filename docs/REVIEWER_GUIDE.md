# Reviewer quick tour

**The question:** when an agent pays twice for one business order, who pays the user back?

**The MVP's answer:** the operator prefunds a narrow execution guarantee. A fixed contract checks the confirmed excess debit and pays the user once from reserved capital.

## 1. See the story

[Watch the 75-second English film](https://youtu.be/0WrEHcNbB64). It shows actual local EVM token transfers inside a controlled duplicate-payment scenario.

| Film segment | What to notice |
| --- | --- |
| Opening | One order, two payments: who is responsible? |
| Funding and terms | 1 DemoUSD fee; 10 reserved before execution |
| Failure | A second distinct payment charges the same business order |
| Compensation | User **79 → 89**; operator pool **100 → 90** |
| Evidence and scope | Four receipts, one payout, explicit integration status |

## 2. Inspect the result

[Open the hosted dashboard](https://arenacover-seoul-20261109.vercel.app). The hosted version is a **read-only replay**, labelled as a local EVM run. It does not ask reviewers to connect or fund a personal wallet.

The recorded final state is:

| Value | Result |
| --- | --- |
| User balance | 89 DemoUSD |
| Operator pool | 90 DemoUSD |
| Reserved balance | 0 |
| Compensation | 10 DemoUSD |
| Confirmed business-step receipts | 4 |
| Actual network | Local EVM, chain 31337 |

[Run JSON](../public/evidence/run.json) includes the fixed order, contract addresses, transaction hashes, blocks and balances. Local transaction hashes do not have public Injective explorer pages. Deployment transaction hashes are listed separately in [deployment metadata](../public/deployment.json).

## 3. Read the implementation

- [Contract](../contracts/ArenaCover.sol): `protect()` reserves 10 before execution; `injectDuplicate()` intentionally creates the business retry fault; `claim()` verifies the duplicate stage and pays once.
- [Behavior tests](../tests/contracts.test.mjs): successful payout, normal-payment claim rejection, repeated-claim rejection, capital and actor/allowance protections.
- [Signing-fence tests](../tests/signing-fence.test.mjs): local mode refuses remote RPCs/public chain IDs, and testnet mode refuses mainnet before loading key material.
- [Frontend](../src/app/page.tsx): live local interaction, testnet wallet path, persisted receipts and hosted replay.

[Run it yourself](./DEVELOPMENT.md) · [Architecture and trust boundary](./ARCHITECTURE.md).

## Integration status

The deployment target is **Injective EVM Testnet, chain 1439**. The deployment script is present; a public testnet deployment has not been completed. Arena402 is the intended first integration target. TEE and x402 are not connected.

The prototype combines execution and verification in one controlled demo contract. It does not establish independent responsibility for arbitrary external agents or cover trading performance. All DemoUSD tokens have no monetary value.
