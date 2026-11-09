import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import ganache from "ganache";
import {
  createPublicClient,
  createWalletClient,
  custom,
  keccak256,
  toHex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { compile } from "../scripts/compile.mjs";
const U = 1_000_000n;
let provider, pub, accounts, art;
before(() => {
  art = compile();
  provider = ganache.provider({
    logging: { quiet: true },
    chain: { chainId: 31337 },
    wallet: { totalAccounts: 3 },
  });
  pub = createPublicClient({ transport: custom(provider) });
  accounts = Object.values(provider.getInitialAccounts()).map((a) =>
    privateKeyToAccount(a.secretKey),
  );
});
after(async () => {
  await provider.disconnect();
});
async function setup({ fund = true } = {}) {
  const [operator, user, stranger] = accounts;
  const wallets = accounts.map((account) =>
    createWalletClient({ account, transport: custom(provider) }),
  );
  async function deploy(name, args) {
    const hash = await wallets[0].deployContract({
      ...art[name],
      args,
      chain: null,
    });
    return (await pub.waitForTransactionReceipt({ hash })).contractAddress;
  }
  const token = await deploy("DemoUSD", [operator.address, user.address]);
  const cover = await deploy("ArenaCoverDemo", [
    token,
    operator.address,
    user.address,
    keccak256(toHex(`order-${token}`)),
  ]);
  async function send(
    which,
    name,
    args = [],
    target = cover,
    abi = art.ArenaCoverDemo.abi,
  ) {
    const { request } = await pub.simulateContract({
      account: accounts[which],
      address: target,
      abi,
      functionName: name,
      args,
    });
    const hash = await wallets[which].writeContract({
      ...request,
      chain: null,
    });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, "success");
    return receipt;
  }
  const read = (
    name,
    args = [],
    target = cover,
    abi = art.ArenaCoverDemo.abi,
  ) => pub.readContract({ address: target, abi, functionName: name, args });
  const balance = (address) =>
    read("balanceOf", [address], token, art.DemoUSD.abi);
  if (fund) {
    await send(0, "approve", [cover, 100n * U], token, art.DemoUSD.abi);
    await send(0, "fund", [100n * U]);
  }
  await send(1, "approve", [cover, 21n * U], token, art.DemoUSD.abi);
  return { operator, user, stranger, token, cover, send, read, balance };
}
test("full funded guarantee: 100 → 99 → 89 → 79 → 89; pool 100 → 90", async () => {
  const s = await setup();
  assert.equal(await s.balance(s.user.address), 100n * U);
  await s.send(1, "protect");
  assert.equal(await s.balance(s.user.address), 99n * U);
  assert.equal(await s.read("reserved"), 10n * U);
  assert.equal(await s.read("available"), 90n * U);
  await s.send(1, "executePayment");
  assert.equal(await s.balance(s.user.address), 89n * U);
  assert.equal(await s.balance(s.cover), 100n * U);
  await s.send(1, "injectDuplicate");
  assert.equal(await s.balance(s.user.address), 79n * U);
  assert.equal(await s.balance(s.cover), 100n * U);
  await s.send(1, "claim");
  assert.equal(await s.balance(s.user.address), 89n * U);
  assert.equal(await s.balance(s.cover), 90n * U);
  assert.equal(await s.read("reserved"), 0n);
  assert.equal(await s.read("stage"), 4);
});
test("one normal payment does not qualify for a claim and preserves reservation", async () => {
  const s = await setup();
  await s.send(1, "protect");
  await s.send(1, "executePayment");
  await assert.rejects(s.send(1, "claim"));
  assert.equal(await s.balance(s.user.address), 89n * U);
  assert.equal(await s.read("reserved"), 10n * U);
  assert.equal(await s.read("stage"), 2);
});
test("rejects repeated protection, repeated payment steps, repeated claims and out-of-order calls", async () => {
  const s = await setup();
  await assert.rejects(s.send(1, "executePayment"));
  await assert.rejects(s.send(1, "injectDuplicate"));
  await s.send(1, "protect");
  await assert.rejects(s.send(1, "protect"));
  await s.send(1, "executePayment");
  await assert.rejects(s.send(1, "executePayment"));
  await s.send(1, "injectDuplicate");
  await assert.rejects(s.send(1, "injectDuplicate"));
  await s.send(1, "claim");
  await assert.rejects(s.send(1, "claim"));
  assert.equal(await s.balance(s.user.address), 89n * U);
});
test("fixed user and operator permissions prevent theft and claim redirection", async () => {
  const s = await setup();
  await assert.rejects(s.send(2, "protect"));
  await assert.rejects(s.send(1, "fund", [U]));
  await s.send(1, "protect");
  await assert.rejects(s.send(2, "executePayment"));
  await s.send(1, "executePayment");
  await s.send(1, "injectDuplicate");
  await assert.rejects(s.send(2, "claim"));
  await s.send(1, "claim");
  assert.equal(await s.balance(s.stranger.address), 0n);
});
test("insufficient capital cannot sell coverage or collect premium", async () => {
  const s = await setup({ fund: false });
  await assert.rejects(s.send(1, "protect"));
  assert.equal(await s.balance(s.user.address), 100n * U);
  assert.equal(await s.read("stage"), 0);
  assert.equal(await s.read("reserved"), 0n);
});
test("failed token transfer rolls back policy and locked capital", async () => {
  const s = await setup();
  await s.send(1, "approve", [s.cover, 0n], s.token, art.DemoUSD.abi);
  await assert.rejects(s.send(1, "protect"));
  assert.equal(await s.read("stage"), 0);
  assert.equal(await s.read("reserved"), 0n);
  assert.equal(await s.balance(s.cover), 100n * U);
});
