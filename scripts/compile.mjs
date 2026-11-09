import fs from "node:fs";
import path from "node:path";
import solc from "solc";
export function compile() {
  const source = fs.readFileSync("contracts/ArenaCover.sol", "utf8");
  const input = {
    language: "Solidity",
    sources: { "ArenaCover.sol": { content: source } },
    settings: {
      evmVersion: "paris",
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
  };
  const output = JSON.parse(
    solc.compile(JSON.stringify(input), {
      import: (name) => {
        try {
          return {
            contents: fs.readFileSync(path.join("node_modules", name), "utf8"),
          };
        } catch {
          return { error: `Missing dependency: ${name}` };
        }
      },
    }),
  );
  const errors = (output.errors ?? []).filter((e) => e.severity === "error");
  if (errors.length)
    throw new Error(errors.map((e) => e.formattedMessage).join("\n"));
  return Object.fromEntries(
    ["DemoUSD", "ArenaCoverDemo"].map((name) => [
      name,
      {
        abi: output.contracts["ArenaCover.sol"][name].abi,
        bytecode: `0x${output.contracts["ArenaCover.sol"][name].evm.bytecode.object}`,
      },
    ]),
  );
}
if (process.argv[1]?.endsWith("/compile.mjs")) {
  fs.mkdirSync("artifacts", { recursive: true });
  const artifacts = compile();
  for (const [name, data] of Object.entries(artifacts))
    fs.writeFileSync(`artifacts/${name}.json`, JSON.stringify(data, null, 2) + "\n");
  fs.mkdirSync("src/lib", { recursive: true });
  fs.writeFileSync(
    "src/lib/abi.json",
    JSON.stringify(
      { token: artifacts.DemoUSD.abi, cover: artifacts.ArenaCoverDemo.abi },
      null,
      2,
    ) + "\n",
  );
  console.log("Compiled DemoUSD and ArenaCoverDemo (Paris EVM).");
}
