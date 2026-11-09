import fs from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const d = JSON.parse(fs.readFileSync("public/deployment.json", "utf8"));
const evidence = JSON.parse(
  fs.readFileSync("public/evidence/run.json", "utf8"),
);
if (d.mode !== "local" || d.cover !== evidence.cover)
  throw new Error("Use the completed local browser-check deployment.");
const receipts = evidence.transactions
  .filter((x) => x.name !== "approve")
  .map((x) => ({
    action: x.name,
    hash: x.hash,
    block: x.blockNumber,
    balance: String(BigInt(x.userBalance) / 1_000_000n),
  }));
const key = `arenacover:v1:${d.chainId}:${d.cover}`;
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await page.evaluate(
    ({ key, receipts }) => {
      localStorage.setItem(key, JSON.stringify(receipts.slice(0, -1)));
      localStorage.setItem(
        `${key}:pending`,
        JSON.stringify({ hash: receipts.at(-1).hash, action: "claim" }),
      );
    },
    { key, receipts },
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("COMPENSATED", { exact: true }).waitFor();
  await page.waitForFunction(
    (key) => JSON.parse(localStorage.getItem(key) ?? "[]").length === 4,
    key,
  );
  const actual = await page.evaluate(
    (key) => ({
      count: JSON.parse(localStorage.getItem(key) ?? "[]").length,
      pending: localStorage.getItem(`${key}:pending`),
    }),
    key,
  );
  assert.equal(actual.count, 4);
  assert.equal(actual.pending, null);
  console.log(
    JSON.stringify({
      passed: true,
      recoveredClaim: true,
      records: 4,
      pendingClearedAfterPersistence: true,
    }),
  );
} finally {
  await browser.close();
}
