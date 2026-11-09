import fs from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
const c = JSON.parse(fs.readFileSync("public/deployment.json", "utf8"));
const abi = JSON.parse(fs.readFileSync("src/lib/abi.json", "utf8"));
const local = c.mode === "local";
if (!["local", "testnet"].includes(c.mode))
  throw new Error("Unknown network mode");
if (
  local &&
  (c.chainId !== 31337 ||
    !["127.0.0.1", "localhost"].includes(new URL(c.rpcUrl).hostname))
)
  throw new Error("Sandbox signing is restricted to localhost chain 31337");
if (!local && c.chainId !== 1439)
  throw new Error("Only Injective testnet 1439 is supported");
const user = local
  ? mnemonicToAccount(
      "test test test test test test test test test test test junk",
      { addressIndex: 1 },
    )
  : privateKeyToAccount(
      JSON.parse(fs.readFileSync(".local/testnet-wallets.json", "utf8")).user,
    );
const chain = defineChain({
  id: c.chainId,
  name: c.network,
  nativeCurrency: { name: "Gas", symbol: local ? "ETH" : "INJ", decimals: 18 },
  rpcUrls: { default: { http: [c.rpcUrl] } },
});
const pub = createPublicClient({
  chain,
  transport: http(),
  pollingInterval: 100,
});
const wallet = createWalletClient({ chain, account: user, transport: http() });
if ((await pub.getChainId()) !== c.chainId) throw new Error("Wrong chain");
if (user.address.toLowerCase() !== c.user.toLowerCase())
  throw new Error("Demo user does not match deployment");
const steps = [];
const balance = () =>
  pub.readContract({
    address: c.token,
    abi: abi.token,
    functionName: "balanceOf",
    args: [c.user],
  });
async function tx(name, address, args = [], contractAbi = abi.cover) {
  const { request } = await pub.simulateContract({
    account: user,
    address,
    abi: contractAbi,
    functionName: name,
    args,
  });
  const hash = await wallet.writeContract({
    ...request,
    gasPrice: local ? undefined : 160000000n,
  });
  const r = await pub.waitForTransactionReceipt({ hash });
  if (r.status !== "success") throw new Error("Transaction reverted");
  const item = {
    name,
    hash,
    blockNumber: String(r.blockNumber),
    userBalance: String(await balance()),
  };
  steps.push(item);
  console.log(JSON.stringify(item));
}
await tx("approve", c.token, [c.cover, 21_000_000n], abi.token);
for (const name of ["protect", "executePayment", "injectDuplicate", "claim"])
  await tx(name, c.cover);
const result = {
  ...c,
  recordedAt: new Date().toISOString(),
  transactions: steps,
  finalUserBalance: String(await balance()),
  finalPoolBalance: String(
    await pub.readContract({
      address: c.token,
      abi: abi.token,
      functionName: "balanceOf",
      args: [c.cover],
    }),
  ),
  reserved: String(
    await pub.readContract({
      address: c.cover,
      abi: abi.cover,
      functionName: "reserved",
    }),
  ),
  tee: {
    status: "not_connected",
    reason:
      "No reusable attested signer and verifier found in the referenced Arena repositories.",
  },
};
fs.mkdirSync("public/evidence", { recursive: true });
fs.writeFileSync("public/evidence/run.json", JSON.stringify(result, null, 2));
console.log("Evidence saved to public/evidence/run.json");
