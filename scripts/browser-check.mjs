import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createPublicClient, http } from "viem";
const d = JSON.parse(fs.readFileSync("public/deployment.json", "utf8"));
const abi = JSON.parse(fs.readFileSync("src/lib/abi.json", "utf8"));
fs.mkdirSync("test-results", { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  deviceScaleFactor: 1,
});
const page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Connect sandbox wallet" }).click();
  await page.getByRole("button", { name: "✓ Wallet connected" }).waitFor();
  await page.screenshot({ path: "test-results/01-ready.png", fullPage: true });
  await page.getByRole("button", { name: /Protect this trade/ }).click();
  await page.getByText("Capital reserved before execution").waitFor();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="user-balance"]')
      ?.textContent?.startsWith("99"),
  );
  await page.screenshot({
    path: "test-results/02-protected.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Run fault scenario/ }).click();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="user-balance"]')
      ?.textContent?.startsWith("79"),
  );
  await page
    .getByRole("button", { name: /Verify & compensate/ })
    .waitFor({ state: "visible" });
  await page.screenshot({
    path: "test-results/03-duplicate.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Verify & compensate/ }).click();
  await page.getByText("COMPENSATED", { exact: true }).waitFor();
  await page.waitForFunction(() =>
    document
      .querySelector('[data-testid="pool-balance"]')
      ?.textContent?.startsWith("90"),
  );
  await page.screenshot({
    path: "test-results/04-compensated.png",
    fullPage: true,
  });
  const key = `arenacover:v1:${d.chainId}:${d.cover}`;
  const txs = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "[]"),
    key,
  );
  assert.equal(txs.length, 4);
  assert.equal(errors.length, 0, errors.join("\n"));
  const pub = createPublicClient({ transport: http(d.rpcUrl) });
  const userBalance = await pub.readContract({
    address: d.token,
    abi: abi.token,
    functionName: "balanceOf",
    args: [d.user],
  });
  const poolBalance = await pub.readContract({
    address: d.token,
    abi: abi.token,
    functionName: "balanceOf",
    args: [d.cover],
  });
  const reserved = await pub.readContract({
    address: d.cover,
    abi: abi.cover,
    functionName: "reserved",
  });
  assert.equal(userBalance, 89_000_000n);
  assert.equal(poolBalance, 90_000_000n);
  assert.equal(reserved, 0n);
  for (const tx of txs) {
    const receipt = await pub.getTransactionReceipt({ hash: tx.hash });
    assert.equal(receipt.status, "success");
  }
  fs.mkdirSync("public/evidence", { recursive: true });
  fs.writeFileSync(
    "public/evidence/run.json",
    JSON.stringify(
      {
        ...d,
        recordedAt: new Date().toISOString(),
        transactions: txs.map((t) => ({
          name: t.action,
          hash: t.hash,
          blockNumber: t.block,
          userBalance: String(BigInt(t.balance) * 1_000_000n),
        })),
        finalUserBalance: String(userBalance),
        finalPoolBalance: String(poolBalance),
        reserved: String(reserved),
        tee: { status: "not_connected", verified: false },
        verification: {
          browser: "Playwright Chromium",
          pageErrors: errors,
          confirmedReceipts: txs.length,
        },
      },
      null,
      2,
    ),
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("COMPENSATED", { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/05-mobile.png", fullPage: true });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
    false,
    "Mobile horizontal overflow",
  );
  console.log(
    JSON.stringify({
      passed: true,
      mode: d.mode,
      chainId: d.chainId,
      confirmedReceipts: 4,
      userBalance: "89",
      poolBalance: "90",
      reserved: "0",
      browserErrors: errors,
      mobileOverflow: false,
    }),
  );
} finally {
  await browser.close();
}
