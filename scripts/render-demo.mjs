import fs from "node:fs";
import { spawnSync } from "node:child_process";
const d = JSON.parse(fs.readFileSync("public/deployment.json", "utf8"));
const local = d.mode === "local";
fs.mkdirSync(".local/audio", { recursive: true });
const segments = [
  [
    0,
    "Trading agents can move money on their own. But when execution goes wrong, users ask one question: who pays?",
  ],
  [
    12,
    `Arena Cover backs a specific execution promise with capital reserved ${local ? "in a local blockchain sandbox" : "on the Injective testnet"}. This controlled demo covers one duplicate payment.`,
  ],
  [
    26,
    "We pay ten tokens, then inject a business retry bug. A second payment charges the same order again. Both transactions transfer real, valueless test tokens.",
  ],
  [
    45,
    "The contract checks confirmed payments against the agreed limit. The extra ten tokens return to the user from the reserved pool. Every step has a transaction receipt.",
  ],
  [
    68,
    "T E E verification is not connected in this build. Market losses are excluded. Tests reject normal payment claims and repeated claims.",
  ],
  [
    80,
    "Our first target is Arena Four Oh Two. Every delegated trade deserves a clear, funded responsibility commitment.",
  ],
];
for (let i = 0; i < segments.length; i++) {
  fs.writeFileSync(`.local/audio/${i}.txt`, segments[i][1]);
  const r = spawnSync(
    "/usr/bin/say",
    [
      "-v",
      "Samantha",
      "-r",
      "145",
      "-f",
      `.local/audio/${i}.txt`,
      "-o",
      `.local/audio/${i}.aiff`,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0) throw new Error(r.stderr);
}
const found = spawnSync(
  "python3",
  ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
  { encoding: "utf8" },
);
if (found.status !== 0)
  throw new Error("Install imageio-ffmpeg to render the recording.");
const ffmpeg = found.stdout.trim();
const args = ["-y", "-i", "delivery/ArenaCover_Raw.webm"];
for (let i = 0; i < segments.length; i++)
  args.push("-i", `.local/audio/${i}.aiff`);
const filters =
  segments
    .map(
      ([start], i) =>
        `[${i + 1}:a]adelay=${start * 1000}|${start * 1000}[a${i}]`,
    )
    .join(";") +
  ";" +
  segments.map((_, i) => `[a${i}]`).join("") +
  `amix=inputs=${segments.length}:normalize=0,apad[a]`;
args.push(
  "-filter_complex",
  filters,
  "-map",
  "0:v",
  "-map",
  "[a]",
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-crf",
  "23",
  "-pix_fmt",
  "yuv420p",
  "-c:a",
  "aac",
  "-b:a",
  "128k",
  "-t",
  "90",
  "-movflags",
  "+faststart",
  "delivery/ArenaCover_Demo90s.mp4",
);
const r = spawnSync(ffmpeg, args, { encoding: "utf8", maxBuffer: 5_000_000 });
if (r.status !== 0) throw new Error(r.stderr.slice(-5000));
fs.writeFileSync(
  "delivery/NARRATION.txt",
  segments.map(([time, text]) => `${time}s: ${text}`).join("\n\n") + "\n",
);
console.log(
  JSON.stringify({
    rendered: true,
    path: "delivery/ArenaCover_Demo90s.mp4",
    duration: 90,
    mode: d.mode,
    voice: "macOS Samantha synthesized narration",
  }),
);
