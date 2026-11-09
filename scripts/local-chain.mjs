import ganache from "ganache";
const server = ganache.server({
  chain: { chainId: 31337 },
  wallet: {
    mnemonic: "test test test test test test test test test test test junk",
    totalAccounts: 4,
    defaultBalance: 1000,
  },
  logging: { quiet: true },
  server: { ws: false },
});
await server.listen(8545, "127.0.0.1");
console.log(
  "ArenaCover local EVM running at http://127.0.0.1:8545 (chain 31337). Public development mnemonic; never use these accounts outside localhost.",
);
process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});
