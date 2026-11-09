import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
const script = path.resolve("scripts/scenario.mjs");
for (const [name, config, message] of [
  [
    "sandbox refuses a public RPC before signing",
    { mode: "local", chainId: 31337, rpcUrl: "https://example.invalid" },
    "restricted to localhost",
  ],
  [
    "sandbox refuses public chain IDs",
    { mode: "local", chainId: 1439, rpcUrl: "http://127.0.0.1:8545" },
    "restricted to localhost",
  ],
  [
    "testnet signer refuses mainnet before loading key material",
    { mode: "testnet", chainId: 1, rpcUrl: "https://example.invalid" },
    "Only Injective testnet",
  ],
])
  test(name, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "arenacover-fence-"));
    try {
      fs.mkdirSync(path.join(root, "public"));
      fs.mkdirSync(path.join(root, "src/lib"), { recursive: true });
      fs.writeFileSync(
        path.join(root, "public/deployment.json"),
        JSON.stringify(config),
      );
      fs.writeFileSync(path.join(root, "src/lib/abi.json"), "{}");
      const r = spawnSync(process.execPath, [script], {
        cwd: root,
        encoding: "utf8",
        timeout: 10000,
      });
      assert.notEqual(r.status, 0);
      assert.match(r.stderr, new RegExp(message));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
