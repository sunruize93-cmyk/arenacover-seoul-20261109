import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  toFunctionSelector,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const d = JSON.parse(fs.readFileSync("public/deployment.json", "utf8"));
const abi = JSON.parse(fs.readFileSync("src/lib/abi.json", "utf8"));
const local = d.mode === "local";
if (
  !["local", "testnet"].includes(d.mode) ||
  d.chainId !== (local ? 31337 : 1439)
)
  throw new Error("Unsupported recording network");
if (local && !["localhost", "127.0.0.1"].includes(new URL(d.rpcUrl).hostname))
  throw new Error("Local RPC required");
const chain = defineChain({
  id: d.chainId,
  name: d.network,
  nativeCurrency: { name: "Gas", symbol: local ? "ETH" : "INJ", decimals: 18 },
  rpcUrls: { default: { http: [d.rpcUrl] } },
});
const pub = createPublicClient({
  chain,
  transport: http(),
  pollingInterval: 150,
});
if ((await pub.getChainId()) !== d.chainId) throw new Error("Wrong RPC chain");
if (
  Number(
    await pub.readContract({
      address: d.cover,
      abi: abi.cover,
      functionName: "stage",
    }),
  ) !== 0
)
  throw new Error("Prepare a fresh deployment before recording");
fs.mkdirSync(".local/recordings", { recursive: true });
fs.mkdirSync("delivery", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: ".local/recordings", size: { width: 1920, height: 1080 } },
});
if (!local) {
  const secrets = JSON.parse(
    fs.readFileSync(".local/testnet-wallets.json", "utf8"),
  );
  const account = privateKeyToAccount(secrets.user);
  assert.equal(account.address.toLowerCase(), d.user.toLowerCase());
  const wallet = createWalletClient({ chain, account, transport: http() });
  const tokenSelector = toFunctionSelector("approve(address,uint256)");
  const coverSelectors = new Set(
    ["protect()", "executePayment()", "injectDuplicate()", "claim()"].map(
      toFunctionSelector,
    ),
  );
  // Test driver only. The private key stays in this local Node process, never in the website.
  await context.exposeFunction(
    "arenaTestWalletRequest",
    async ({ method, params = [] }) => {
      if (["eth_requestAccounts", "eth_accounts"].includes(method))
        return [account.address];
      if (method === "eth_chainId") return "0x59f";
      if (method === "wallet_switchEthereumChain") {
        if (params[0]?.chainId !== "0x59f")
          throw new Error("Only testnet 1439");
        return null;
      }
      if (method === "eth_sendTransaction") {
        const tx = params[0];
        if (
          tx.from.toLowerCase() !== account.address.toLowerCase() ||
          BigInt(tx.value ?? "0") !== 0n
        )
          throw new Error("Unexpected transaction");
        const selector = tx.data.slice(0, 10),
          to = tx.to.toLowerCase();
        if (!(
          (to === d.token.toLowerCase() && selector === tokenSelector) ||
          (to === d.cover.toLowerCase() && coverSelectors.has(selector))
        ))
          throw new Error(
            "Only this demo’s deployed contracts and actions are allowed",
          );
        if ((await pub.getChainId()) !== 1439)
          throw new Error("Wrong RPC chain");
        return wallet.sendTransaction({
          to: tx.to,
          data: tx.data,
          gasPrice: 160000000n,
        });
      }
      throw new Error(`Unsupported test wallet method: ${method}`);
    },
  );
  await context.addInitScript(() => {
    window.ethereum = {
      request: (args) => window.arenaTestWalletRequest(args),
    };
  });
}
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const start = Date.now();
const at = async (seconds) => {
  const remaining = start + seconds * 1000 - Date.now();
  if (remaining > 0)
    await new Promise((resolve) => setTimeout(resolve, remaining));
};
try {
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="user-balance"]')
      ?.textContent?.startsWith("100"),
  );
  await at(4);
  await page
    .getByRole("button", {
      name: local ? "Connect sandbox wallet" : "Connect wallet",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "✓ Wallet connected" }).waitFor();
  await at(12);
  await page.evaluate(() => document.querySelector("#workspace").scrollIntoView({behavior:"instant",block:"start"}));
  await page.getByRole("button", { name: /Protect this trade/ }).click();
  await page.locator("#workspace").evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="user-balance"]')
      ?.textContent?.startsWith("99"),
  );
  await at(26);
  await page.getByRole("button", { name: /Run fault scenario/ }).click();
  await page.locator("#workspace").evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="user-balance"]')
        ?.textContent?.startsWith("79"),
    {},
    { timeout: 60000 },
  );
  await at(45);
  await page.getByRole("button", { name: /Verify & compensate/ }).click();
  await page.locator("#workspace").evaluate(el=>el.scrollIntoView({block:"start",behavior:"instant"}));
  await page
    .getByText("COMPENSATED", { exact: true })
    .waitFor({ timeout: 60000 });
  await at(60);
  await page.evaluate(() =>
    document
      .querySelector("#evidence")
      ?.scrollIntoView({ behavior: "instant", block: "center" }),
  );
  await at(68);
  await page.evaluate(() =>
    document
      .querySelector(".tee-status")
      ?.scrollIntoView({ behavior: "instant", block: "center" }),
  );
  await at(80);
  await page.evaluate(() => document.querySelector("#workspace").scrollIntoView({behavior:"instant",block:"start"}));
  const key = `arenacover:v1:${d.chainId}:${d.cover}`;
  const receipts = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
    key,
  );
  assert.equal(receipts.length, 4);
  assert.equal(errors.length, 0, errors.join("\n"));
  const [balance, pool, reserved] = await Promise.all([
    pub.readContract({
      address: d.token,
      abi: abi.token,
      functionName: "balanceOf",
      args: [d.user],
    }),
    pub.readContract({
      address: d.token,
      abi: abi.token,
      functionName: "balanceOf",
      args: [d.cover],
    }),
    pub.readContract({
      address: d.cover,
      abi: abi.cover,
      functionName: "reserved",
    }),
  ]);
  assert.equal(balance, 89_000_000n);
  assert.equal(pool, 90_000_000n);
  assert.equal(reserved, 0n);
  for (const r of receipts)
    assert.equal(
      (await pub.getTransactionReceipt({ hash: r.hash })).status,
      "success",
    );
  fs.writeFileSync(
    "public/evidence/run.json",
    JSON.stringify(
      {
        ...d,
        recordedAt: new Date().toISOString(),
        transactions: receipts.map((r) => ({
          name: r.action,
          hash: r.hash,
          blockNumber: r.block,
          userBalance: String(BigInt(r.balance) * 1_000_000n),
        })),
        finalUserBalance: String(balance),
        finalPoolBalance: String(pool),
        reserved: String(reserved),
        tee: { status: "not_connected", verified: false },
        verification: {
          browser: "Playwright Chromium",
          confirmedReceipts: 4,
          pageErrors: errors,
        },
      },
      null,
      2,
    ),
  );
  await page.screenshot({
    path: "delivery/ArenaCover_Result.png",
    fullPage: true,
  });
  await at(90);
  const video = page.video();
  await context.close();
  await video.saveAs("delivery/ArenaCover_Raw.webm");
  console.log(
    JSON.stringify({
      recorded: true,
      mode: d.mode,
      chainId: d.chainId,
      receipts: 4,
      rawVideo: "delivery/ArenaCover_Raw.webm",
      evidence: "public/evidence/run.json",
    }),
  );
} finally {
  await browser.close();
}
