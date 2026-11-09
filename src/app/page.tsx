"use client";
import { useEffect, useRef, useState } from "react";
import {
  createPublicClient,
  createWalletClient,
  http,
  custom,
  defineChain,
  formatUnits,
  isAddress,
  type Abi,
  type Address,
  type Hash,
  type WalletClient,
  type EIP1193Provider,
} from "viem";
import abis from "@/lib/abi.json";

type Deployment = {
  mode: "local" | "testnet" | "unconfigured";
  chainId: number;
  network: string;
  rpcUrl: string;
  explorer: string | null;
  token?: Address;
  cover?: Address;
  user?: Address;
  operator?: Address;
  orderId?: Hash;
  termsHash?: Hash;
  deployedAt?: string;
};
type Snapshot = {
  stage: number;
  balance: bigint;
  pool: bigint;
  reserved: bigint;
  paid: bigint;
  compensation: bigint;
};
type Receipt = { action: string; hash: Hash; block: string; balance: string };
const initial: Snapshot = {
  stage: 0,
  balance: 100_000_000n,
  pool: 100_000_000n,
  reserved: 0n,
  paid: 0n,
  compensation: 0n,
};
const coverAbi = abis.cover as Abi,
  tokenAbi = abis.token as Abi;
const names = [
  "Awaiting protection",
  "Guarantee active",
  "First payment confirmed",
  "Duplicate payment detected",
  "Compensation confirmed",
];
const short = (s?: string) =>
  s ? `${s.slice(0, 6)}…${s.slice(-4)}` : "Not configured";
const amount = (n: bigint) => formatUnits(n, 6);
const localHost = () =>
  ["localhost", "127.0.0.1"].includes(window.location.hostname);
const storageKey = (d: Deployment) => `arenacover:v1:${d.chainId}:${d.cover}`;
function chainFor(d: Deployment) {
  return defineChain({
    id: d.chainId,
    name: d.network,
    nativeCurrency: {
      name: d.mode === "local" ? "Test Ether" : "Injective",
      symbol: d.mode === "local" ? "ETH" : "INJ",
      decimals: 18,
    },
    rpcUrls: { default: { http: [d.rpcUrl] } },
  });
}
function client(d: Deployment) {
  return createPublicClient({
    chain: chainFor(d),
    transport: http(d.rpcUrl, { timeout: 10000, retryCount: 0 }),
    pollingInterval: 300,
  });
}
function persistReceipt(
  d: Deployment,
  action: string,
  hash: Hash,
  block: bigint,
  balance: bigint,
): Receipt[] {
  let cached: Receipt[] = [];
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(d)) ?? "[]");
    if (Array.isArray(saved)) cached = saved;
  } catch {
    /* replace malformed cache */
  }
  if (action !== "approve") {
    const item: Receipt = {
      action,
      hash,
      block: String(block),
      balance: amount(balance),
    };
    cached = [...cached.filter((x) => x.hash !== hash), item];
    localStorage.setItem(storageKey(d), JSON.stringify(cached));
  }
  // Only clear pending AFTER the receipt has been persisted.
  localStorage.removeItem(`${storageKey(d)}:pending`);
  return cached;
}
async function read(d: Deployment): Promise<Snapshot> {
  if (!d.cover || !d.token || !d.user)
    throw new Error("Deploy the demo contracts first.");
  const p = client(d);
  if ((await p.getChainId()) !== d.chainId)
    throw new Error("RPC chain does not match deployment.");
  const [stage, balance, pool, reserved, paid, compensation] =
    await Promise.all([
      p.readContract({
        address: d.cover,
        abi: coverAbi,
        functionName: "stage",
      }),
      p.readContract({
        address: d.token,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [d.user],
      }),
      p.readContract({
        address: d.token,
        abi: tokenAbi,
        functionName: "balanceOf",
        args: [d.cover],
      }),
      ...["reserved", "paidTotal", "compensation"].map((functionName) =>
        p.readContract({ address: d.cover!, abi: coverAbi, functionName }),
      ),
    ]);
  return {
    stage: Number(stage),
    balance: balance as bigint,
    pool: pool as bigint,
    reserved: reserved as bigint,
    paid: paid as bigint,
    compensation: compensation as bigint,
  };
}
function Shield() {
  return (
    <svg viewBox="0 0 32 36" fill="none" aria-hidden="true">
      <path
        d="M16 2 29 7v10c0 8-8 14-13 17C11 31 3 25 3 17V7L16 2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m10 17 4 4 8-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export default function Home() {
  const [deployment, setDeployment] = useState<Deployment | null>(null),
    [state, setState] = useState(initial),
    [connected, setConnected] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [receipts, setReceipts] = useState<Receipt[]>([]),
    [replay, setReplay] = useState(false),
    [observed, setObserved] = useState(false),
    [loaded, setLoaded] = useState(false);
  const wallet = useRef<WalletClient | null>(null),
    lock = useRef(false);
  const applyReplay = async (d: Deployment) => {
    const r = await fetch("/evidence/run.json", { cache: "no-store" });
    if (!r.ok) throw new Error("No recorded run is available.");
    const e = await r.json();
    if (
      e.cover !== d.cover ||
      e.chainId !== d.chainId ||
      e.finalUserBalance !== "89000000" ||
      e.finalPoolBalance !== "90000000"
    )
      throw new Error("Recorded evidence does not match this deployment.");
    setState({
      stage: 4,
      balance: BigInt(e.finalUserBalance),
      pool: BigInt(e.finalPoolBalance),
      reserved: BigInt(e.reserved),
      paid: 20_000_000n,
      compensation: 10_000_000n,
    });
    setReceipts(
      e.transactions
        .filter((x: { name: string }) => x.name !== "approve")
        .map(
          (x: {
            name: string;
            hash: Hash;
            blockNumber: string;
            userBalance: string;
          }) => ({
            action: x.name,
            hash: x.hash,
            block: x.blockNumber,
            balance: formatUnits(BigInt(x.userBalance), 6),
          }),
        ),
    );
    setReplay(true);
    setObserved(true);
    setNotice(
      "Recorded local-chain run. These are confirmed test-token transactions; this view is a replay.",
    );
  };
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const r = await fetch("/deployment.json", { cache: "no-store" });
        if (!r.ok) throw new Error("Deployment configuration unavailable.");
        const d: Deployment = await r.json();
        if (cancelled) return;
        setDeployment(d);
        if (d.mode === "unconfigured") {
          setNotice(
            "Contracts are not deployed yet. Follow the setup guide in the repository.",
          );
          return;
        }
        if (
          ![31337, 1439].includes(d.chainId) ||
          !isAddress(d.cover ?? "") ||
          !isAddress(d.token ?? "")
        )
          throw new Error("Invalid demo deployment.");
        if (d.mode === "local" && !localHost()) {
          await applyReplay(d);
          return;
        }
        const s = await read(d);
        if (cancelled) return;
        setState(s);
        setObserved(true);
        const pending = localStorage.getItem(`${storageKey(d)}:pending`);
        if (pending) {
          const item = JSON.parse(pending);
          try {
            const confirmed = await client(d).getTransactionReceipt({
              hash: item.hash,
            });
            if (confirmed.status === "success")
              setReceipts(
                persistReceipt(
                  d,
                  item.action,
                  item.hash,
                  confirmed.blockNumber,
                  s.balance,
                ),
              );
            else {
              localStorage.removeItem(`${storageKey(d)}:pending`);
              setNotice(
                "Previous transaction reverted; no payment was recorded.",
              );
            }
          } catch {
            setNotice(
              "A broadcast transaction is still unresolved. Its hash is retained; do not resend it.",
            );
          }
        }
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey(d)) ?? "[]");
          if (Array.isArray(saved))
            setReceipts(
              saved.filter((x: Receipt) => /^0x[0-9a-fA-F]{64}$/.test(x.hash)),
            );
        } catch {
          /* optional cached evidence */
        }
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Could not load the chain.",
          );
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);
  async function connect() {
    if (!deployment || lock.current || replay) return;
    setError("");
    setBusy("Connecting wallet");
    lock.current = true;
    try {
      const d = deployment;
      if (!d.cover || !d.user) throw new Error("No deployed contracts.");
      if (d.mode === "local") {
        if (
          !localHost() ||
          d.chainId !== 31337 ||
          !["127.0.0.1", "localhost"].includes(new URL(d.rpcUrl).hostname)
        )
          throw new Error(
            "Sandbox signing is restricted to localhost chain 31337.",
          );
        if ((await client(d).getChainId()) !== 31337)
          throw new Error("Not the local sandbox chain.");
        const { mnemonicToAccount } = await import("viem/accounts");
        const account = mnemonicToAccount(
          "test test test test test test test test test test test junk",
          { addressIndex: 1 },
        );
        if (account.address.toLowerCase() !== d.user.toLowerCase())
          throw new Error("Sandbox user mismatch.");
        wallet.current = createWalletClient({
          account,
          chain: chainFor(d),
          transport: http(d.rpcUrl),
        });
      } else {
        const ethereum = (window as Window & { ethereum?: EIP1193Provider })
          .ethereum;
        if (!ethereum)
          throw new Error(
            "Install an EVM wallet to connect to the Injective testnet.",
          );
        const w = createWalletClient({
          chain: chainFor(d),
          transport: custom(ethereum),
        });
        const addresses = await w.requestAddresses();
        if (addresses[0]?.toLowerCase() !== d.user.toLowerCase())
          throw new Error(
            `This fixed demo requires ${short(d.user)}. Switch to the demo wallet.`,
          );
        await w.switchChain({ id: d.chainId });
        wallet.current = createWalletClient({
          account: addresses[0],
          chain: chainFor(d),
          transport: custom(ethereum),
        });
      }
      setState(await read(d));
      setObserved(true);
      setConnected(true);
      setNotice(
        d.mode === "local"
          ? "Connected to the public development wallet on localhost only. No real assets."
          : "Connected to the fixed testnet demo wallet.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wallet connection failed.");
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  async function action(kind: "protect" | "fault" | "claim") {
    if (lock.current || !deployment || !wallet.current || replay) return;
    lock.current = true;
    setError("");
    const d = deployment;
    const w = wallet.current;
    async function write(
      functionName: string,
      target: Address,
      args: readonly unknown[] = [],
      abi: Abi = coverAbi,
    ) {
      const addresses = await w.getAddresses();
      if (
        addresses[0]?.toLowerCase() !== d.user?.toLowerCase() ||
        (await w.getChainId()) !== d.chainId
      )
        throw new Error(
          "Wallet account or chain changed. Reconnect the fixed demo wallet.",
        );
      setBusy(
        functionName === "injectDuplicate"
          ? "Confirming controlled duplicate payment"
          : functionName === "claim"
            ? "Confirming compensation"
            : functionName === "approve"
              ? "Preparing 21-token allowance"
              : functionName === "protect"
                ? "Reserving guarantee capital"
                : "Confirming first payment",
      );
      const p = client(d);
      await p.simulateContract({
        account: d.user!,
        address: target,
        abi,
        functionName,
        args,
      });
      const hash = await w.writeContract({
        address: target,
        abi,
        functionName,
        args,
        account: w.account ?? d.user!,
        chain: chainFor(d),
        gasPrice: d.mode === "testnet" ? 160000000n : undefined,
      });
      // Persist broadcast identity before waiting: unknown results must not be resent.
      localStorage.setItem(
        `${storageKey(d)}:pending`,
        JSON.stringify({ hash, action: functionName }),
      );
      const receipt = await p.waitForTransactionReceipt({
        hash,
        timeout: 60000,
      });
      if (receipt.status !== "success") {
        localStorage.removeItem(`${storageKey(d)}:pending`);
        throw new Error(
          "Transaction reverted. No successful payment recorded.",
        );
      }
      const s = await read(d);
      setState(s);
      setReceipts(
        persistReceipt(d, functionName, hash, receipt.blockNumber, s.balance),
      );
    }
    try {
      const pending = localStorage.getItem(`${storageKey(d)}:pending`);
      if (pending) {
        const item = JSON.parse(pending);
        setBusy("Checking previously broadcast transaction");
        const r = await client(d).waitForTransactionReceipt({
          hash: item.hash,
          timeout: 15000,
        });
        const recovered = await read(d);
        setState(recovered);
        if (r.status !== "success") {
          localStorage.removeItem(`${storageKey(d)}:pending`);
          throw new Error(
            "The previous transaction reverted. State reconciled; retry the unfinished step.",
          );
        }
        setReceipts(
          persistReceipt(
            d,
            item.action,
            item.hash,
            r.blockNumber,
            recovered.balance,
          ),
        );
        setNotice(
          "Previous transaction confirmed. State reconciled; click the next action to continue.",
        );
        return;
      }
      let current = await read(d);
      setState(current);
      if (kind === "protect") {
        if (current.stage !== 0)
          throw new Error("This order is already protected.");
        const allowance = (await client(d).readContract({
          address: d.token!,
          abi: tokenAbi,
          functionName: "allowance",
          args: [d.user!, d.cover!],
        })) as bigint;
        if (allowance < 21_000_000n)
          await write("approve", d.token!, [d.cover!, 21_000_000n], tokenAbi);
        await write("protect", d.cover!);
        setNotice(
          "Guarantee active. Ten tokens are reserved before execution.",
        );
      }
      if (kind === "fault") {
        if (current.stage === 1) {
          await write("executePayment", d.cover!);
          await new Promise((resolve) => setTimeout(resolve, 900));
          current = await read(d);
        }
        if (current.stage === 2) {
          await write("injectDuplicate", d.cover!);
          setNotice(
            "Controlled fault: two distinct payments charged the same business order.",
          );
        } else if (current.stage !== 1)
          throw new Error("The scenario is not ready or already completed.");
      }
      if (kind === "claim") {
        await write("claim", d.cover!);
        setNotice(
          "Confirmed: ten tokens compensated from the operator’s prefunded reserve.",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Transaction failed.";
      setError(msg.length > 280 ? `${msg.slice(0, 280)}…` : msg);
    } finally {
      setBusy("");
      lock.current = false;
    }
  }
  const ready =
    loaded &&
    deployment?.mode !== "unconfigured" &&
    !error.startsWith("Invalid");
  const stage = state.stage;
  return (
    <main>
      <header className="nav">
        <a className="brand" href="/" aria-label="ArenaCover home">
          <span className="brand-icon">
            <Shield />
          </span>
          Arena<span>Cover</span>
        </a>
        <div className="nav-right">
          <span className="edition">BUILT FOR AGENT FINANCE</span>
          <span className="network">
            <i />
            {deployment?.mode === "testnet"
              ? "Injective testnet"
              : deployment?.mode === "local"
                ? "Local EVM sandbox"
                : "Loading network"}
            {replay ? " · REPLAY" : ""}
          </span>
        </div>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">
            <span /> EXECUTION GUARANTEES FOR THE AGENT ECONOMY
          </p>
          <h1>
            Autonomy needs
            <br />
            <em>accountability.</em>
          </h1>
          <p className="hero-copy">
            When an agent pays twice, who pays you back?
            <br />
            Clear terms. Reserved capital. Verifiable compensation.
          </p>
        </div>
        <div className="hero-note">
          <span className="note-number">01</span>
          <p>
            One order.
            <br />
            One funded promise.
          </p>
          <span className="fine">
            Arena402 integration concept
            <br />
            Controlled execution demo
          </span>
        </div>
      </section>
      <section className="workspace" aria-label="Execution guarantee dashboard">
        <article className="panel policy">
          <div className="panel-label">
            <span>01 / THE PROMISE</span>
            <span className="tiny-shield">
              <Shield />
            </span>
          </div>
          <h2>
            Know who stands
            <br />
            behind your agent.
          </h2>
          <div className="operator">
            <span className="avatar">A</span>
            <div>
              <strong>Arena Agent Operator</strong>
              <span>Responsibility provider · Demo</span>
            </div>
            <span
              className="verified-dot"
              title="Demo identity, not an attested identity"
            >
              DEMO
            </span>
          </div>
          <dl className="terms">
            <div>
              <dt>Covered event</dt>
              <dd>Duplicate business payment</dd>
            </div>
            <div>
              <dt>Authorized debit</dt>
              <dd>10 DemoUSD · once</dd>
            </div>
            <div>
              <dt>Maximum compensation</dt>
              <dd>10 DemoUSD</dd>
            </div>
            <div>
              <dt>Guarantee fee</dt>
              <dd>1 DemoUSD</dd>
            </div>
            <div>
              <dt>Beneficiary</dt>
              <dd title={deployment?.user}>{short(deployment?.user)}</dd>
            </div>
            <div>
              <dt>Operator / payee</dt>
              <dd title={deployment?.operator}>
                {short(deployment?.operator)}
              </dd>
            </div>
          </dl>
          <div className="exclusion">
            <span>↗</span>
            <p>
              <strong>Execution risk, precisely defined.</strong>
              <br />
              Market losses are not covered.
            </p>
          </div>
          <div className="order-id">
            <span>BUSINESS ORDER</span>
            <code title={deployment?.orderId}>
              {short(deployment?.orderId)}
            </code>
          </div>
        </article>
        <article className="panel execution">
          <div className="panel-label">
            <span>02 / THE EXECUTION</span>
            <span className={`state-tag ${stage === 4 ? "paid" : ""}`}>
              {stage === 4
                ? "COMPENSATED"
                : stage === 3
                  ? "FAULT DETECTED"
                  : stage > 0
                    ? "PROTECTED"
                    : "READY TO PROTECT"}
            </span>
          </div>
          <div className="balance-heading">
            <div>
              <span className="small-label">USER BALANCE</span>
              <h2 data-testid="user-balance">
                {observed ? amount(state.balance) : "—"}
                <span>DemoUSD</span>
              </h2>
            </div>
            <span className="balance-icon">↗</span>
          </div>
          <div
            className="balance-path"
            aria-label="Expected scenario balance progression"
          >
            <span className={stage === 0 ? "current" : ""}>100</span>
            <b>→</b>
            <span className={stage === 1 ? "current" : ""}>99</span>
            <b>→</b>
            <span className={stage === 2 ? "current" : ""}>89</span>
            <b>→</b>
            <span className={stage === 3 ? "current loss" : ""}>79</span>
            <b>→</b>
            <span className={stage === 4 ? "current" : ""}>89</span>
          </div>
          <p className="path-caption">
            Initial → fee → payment → duplicate → compensation
          </p>
          <ol className="timeline">
            {[
              "Capital reserved before execution",
              "First payment confirmed",
              "Controlled duplicate detected",
              "Compensation confirmed",
            ].map((label, i) => {
              const reached = stage >= i + 1;
              return (
                <li key={label} className={reached ? "reached" : ""}>
                  <span>{reached ? "✓" : `0${i + 1}`}</span>
                  <div>
                    <strong>{label}</strong>
                    <small>
                      {i === 0
                        ? "A funded commitment, not just a promise"
                        : i === 1
                          ? "One authorized 10-token debit"
                          : i === 2
                            ? "Same order · distinct payment IDs"
                            : "10 tokens return to the beneficiary"}
                    </small>
                  </div>
                  {reached ? <b>CONFIRMED</b> : null}
                </li>
              );
            })}
          </ol>
          <div className="actions">
            <button
              className="connect"
              onClick={connect}
              disabled={!ready || !!busy || connected || replay}
            >
              {connected
                ? "✓ Wallet connected"
                : deployment?.mode === "local"
                  ? "Connect sandbox wallet"
                  : "Connect wallet"}
            </button>
            <button
              onClick={() => action("protect")}
              disabled={!connected || !!busy || stage !== 0 || replay}
            >
              Protect this trade <span>↗</span>
            </button>
            <button
              className="secondary"
              onClick={() => action("fault")}
              disabled={
                !connected || !!busy || ![1, 2].includes(stage) || replay
              }
            >
              Run fault scenario <span>→</span>
            </button>
            <button
              className="claim"
              onClick={() => action("claim")}
              disabled={!connected || !!busy || stage !== 3 || replay}
            >
              Verify & compensate <span>↗</span>
            </button>
          </div>
          <div className="message" aria-live="polite">
            {busy ? (
              <p className="working">
                <i />
                {busy}…
              </p>
            ) : error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : (
              <p>
                {notice ||
                  "Connect the demo wallet to begin. All amounts are valueless test tokens."}
              </p>
            )}
          </div>
        </article>
        <aside className="panel capital">
          <div className="panel-label">
            <span>03 / THE BACKING</span>
            <span className="capital-dot" />
          </div>
          <h2>Capital, committed.</h2>
          <div className="capital-total">
            <span className="small-label">GUARANTEE POOL</span>
            <strong data-testid="pool-balance">
              {observed ? amount(state.pool) : "—"}
              <small>DemoUSD</small>
            </strong>
          </div>
          <div className="reserve-meter">
            <div
              style={{
                width: `${state.pool > 0n ? Number((state.reserved * 100n) / state.pool) : 0}%`,
              }}
            />
          </div>
          <div className="reserve-label">
            <span>Reserved</span>
            <strong data-testid="reserved">{amount(state.reserved)}</strong>
          </div>
          <div className="reserve-label">
            <span>Available</span>
            <strong>{amount(state.pool - state.reserved)}</strong>
          </div>
          <div className={`outcome ${stage === 4 ? "success" : ""}`}>
            <span className="small-label">
              {stage === 4 ? "CONFIRMED PAYOUT" : "COVERAGE LIMIT"}
            </span>
            <strong>
              {stage === 4 ? amount(state.compensation) : "10"}
              <small>DemoUSD</small>
            </strong>
            <p>
              {stage === 4
                ? "Paid from the operator’s reserve."
                : "Reserved capital can back this order before the first debit."}
            </p>
          </div>
          <div className="tee-status">
            <span className="small-label">TEE INCIDENT RECEIPT</span>
            <span className="not-connected">Not connected</span>
            <p>
              No verified TEE signer is connected. Claims use confirmed contract
              state.
            </p>
          </div>
          <div className="capital-address">
            <span>RESERVE CONTRACT</span>
            <code title={deployment?.cover}>{short(deployment?.cover)}</code>
          </div>
        </aside>
      </section>
      <section className="evidence" id="evidence">
        <div className="evidence-header">
          <div>
            <p className="eyebrow">THE RECEIPTS, NOT JUST THE RESULT</p>
            <h2>Every step leaves evidence.</h2>
          </div>
          <span className="evidence-count">
            {receipts.length.toString().padStart(2, "0")} CONFIRMED RECORDS
          </span>
        </div>
        {receipts.length ? (
          <div className="receipt-grid">
            {receipts.map((r, i) => (
              <div className="receipt" key={r.hash}>
                <span className="receipt-index">0{i + 1}</span>
                <strong>
                  {{
                    protect: "Guarantee activated",
                    executePayment: "First payment",
                    injectDuplicate: "Duplicate payment",
                    claim: "Compensation paid",
                  }[r.action] ?? r.action}
                </strong>
                <span className="receipt-balance">
                  Balance: {r.balance} DemoUSD
                </span>
                {deployment?.explorer ? (
                  <a
                    href={`${deployment.explorer}/tx/${r.hash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {short(r.hash)} ↗
                  </a>
                ) : (
                  <code title={r.hash}>
                    {short(r.hash)} · block {r.block}
                  </code>
                )}
                <details>
                  <summary>Full transaction hash</summary>
                  <code className="full-hash">{r.hash}</code>
                </details>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-evidence">
            <span>↳</span>Confirmed transaction receipts will appear here as the
            order progresses.
          </div>
        )}
        <div className="proof-links">
          <a href="/deployment.json" target="_blank" rel="noreferrer">
            Deployment configuration ↗
          </a>
          <a href="/evidence/tee.json" target="_blank" rel="noreferrer">
            TEE status disclosure ↗
          </a>
          {replay ? (
            <a href="/evidence/run.json" target="_blank" rel="noreferrer">
              Recorded transaction evidence ↗
            </a>
          ) : null}
        </div>
      </section>
      <footer>
        <span className="brand small">
          ArenaCover<span className="footer-dot">·</span>
          <span>Accountability, by design.</span>
        </span>
        <p>
          Hackathon prototype · Test tokens only · Controlled fault injection
          <br />
          Execution and guarantee share a demo contract. Independent
          external-agent liability is not established.
        </p>
      </footer>
    </main>
  );
}
