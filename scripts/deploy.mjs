import fs from "node:fs";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  keccak256,
  toHex,
  formatEther,
} from "viem";
import {
  mnemonicToAccount,
  privateKeyToAccount,
  generatePrivateKey,
} from "viem/accounts";
import { compile } from "./compile.mjs";
try {
  process.loadEnvFile(".env.local");
} catch {}
const mode = process.argv[2] ?? "local";
if (!["local", "testnet"].includes(mode))
  throw new Error("Use local or testnet");
const local = mode === "local";
fs.mkdirSync(".local", { recursive: true });
fs.mkdirSync("public", { recursive: true });
const mnemonic = "test test test test test test test test test test test junk";
let operator, user;
if (local) {
  operator = mnemonicToAccount(mnemonic);
  user = mnemonicToAccount(mnemonic, { addressIndex: 1 });
} else {
  const file = ".local/testnet-wallets.json";
  let secrets = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : { operator: generatePrivateKey(), user: generatePrivateKey() };
  if (process.env.DEPLOYER_PRIVATE_KEY)
    secrets.operator = process.env.DEPLOYER_PRIVATE_KEY;
  fs.writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
  fs.chmodSync(file, 0o600);
  operator = privateKeyToAccount(secrets.operator);
  user = privateKeyToAccount(secrets.user);
}
const chain = defineChain({
  id: local ? 31337 : 1439,
  name: local ? "Local EVM sandbox" : "Injective EVM Testnet",
  nativeCurrency: {
    name: local ? "Test Ether" : "Injective",
    symbol: local ? "ETH" : "INJ",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        local
          ? "http://127.0.0.1:8545"
          : (process.env.INJECTIVE_RPC_URL ??
            "https://k8s.testnet.json-rpc.injective.network/"),
      ],
    },
  },
});
const pub = createPublicClient({
  chain,
  transport: http(),
  pollingInterval: 150,
});
if ((await pub.getChainId()) !== chain.id)
  throw new Error("Unexpected chain ID");
const balance = await pub.getBalance({ address: operator.address });
console.log(
  JSON.stringify({
    mode,
    chainId: chain.id,
    operator: operator.address,
    user: user.address,
    gasBalance: formatEther(balance),
  }),
);
fs.writeFileSync(
  ".local/wallet-addresses.json",
  JSON.stringify(
    { operator: operator.address, user: user.address, chainId: chain.id },
    null,
    2,
  ),
);
if (!local && balance < 10n ** 15n) {
  console.log(
    "Needs testnet INJ from the official faucet. Addresses saved; no private keys printed.",
  );
  process.exitCode = 2;
} else {
  const wallet = createWalletClient({
    account: operator,
    chain,
    transport: http(),
  });
  const art = compile();
  const txs = {};
  async function deploy(name, args) {
    const hash = await wallet.deployContract({
      ...art[name],
      args,
      gasPrice: local ? undefined : 160000000n,
    });
    const r = await pub.waitForTransactionReceipt({ hash });
    if (r.status !== "success") throw new Error("Deployment reverted");
    txs[name] = hash;
    return r.contractAddress;
  }
  const token = await deploy("DemoUSD", [operator.address, user.address]);
  const orderId = keccak256(toHex(`ArenaCover-${chain.id}-${token}`));
  const cover = await deploy("ArenaCoverDemo", [
    token,
    operator.address,
    user.address,
    orderId,
  ]);
  async function write(address, abi, functionName, args) {
    const { request } = await pub.simulateContract({
      account: operator,
      address,
      abi,
      functionName,
      args,
    });
    const hash = await wallet.writeContract({
      ...request,
      gasPrice: local ? undefined : 160000000n,
    });
    const r = await pub.waitForTransactionReceipt({ hash });
    if (r.status !== "success") throw new Error("Setup reverted");
    return hash;
  }
  txs.approveCapital = await write(token, art.DemoUSD.abi, "approve", [
    cover,
    100_000_000n,
  ]);
  txs.fund = await write(cover, art.ArenaCoverDemo.abi, "fund", [100_000_000n]);
  if (
    !local &&
    (await pub.getBalance({ address: user.address })) < 10n ** 15n
  ) {
    const hash = await wallet.sendTransaction({
      to: user.address,
      value: 2n * 10n ** 16n,
      gasPrice: 160000000n,
    });
    await pub.waitForTransactionReceipt({ hash });
  }
  const termsHash = await pub.readContract({
    address: cover,
    abi: art.ArenaCoverDemo.abi,
    functionName: "termsHash",
  });
  const config = {
    mode,
    chainId: chain.id,
    network: chain.name,
    rpcUrl: chain.rpcUrls.default.http[0],
    explorer: local ? null : "https://testnet.blockscout.injective.network",
    operator: operator.address,
    user: user.address,
    token,
    cover,
    orderId,
    termsHash,
    deployedAt: new Date().toISOString(),
    deploymentTransactions: txs,
  };
  fs.writeFileSync("public/deployment.json", JSON.stringify(config, null, 2));
  fs.writeFileSync(
    `.local/deployment-${mode}.json`,
    JSON.stringify(config, null, 2),
  );
  console.log(
    JSON.stringify({
      deployed: true,
      token,
      cover,
      configuration: "public/deployment.json",
    }),
  );
}
