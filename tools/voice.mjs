// 用 edge-tts 给作品的 intro 配上小念的声音：一件作品一个 mp3，放在 public/voice/<作品id>.mp3，
// 指纹和时长写进 src/work/voice-manifest.ts。只配新的和改过字的，可以随时中断再续。
//   npm run voice                  全部作品
//   npm run voice -- opera-mask    只配这几件
// 需要：python -m pip install edge-tts，以及 PATH 里的 ffmpeg / ffprobe；生成时要联网。
// 这里只放合成的声音；小念自己录的声音放 private/，不走这个工具。
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { introHash, NIAN_VOICE } from "../src/work/voice.ts";
import { VOICE_CLIPS } from "../src/work/voice-manifest.ts";
import { WORKS } from "../src/works/index.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "src/work/voice-manifest.ts");
const voiceDir = join(root, "public/voice");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { err += chunk; });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`${command} 退出码 ${code}: ${err.slice(-400)}`))));
  });
}

const clips = { ...VOICE_CLIPS };

function save() {
  const sorted = Object.entries(clips).sort(([a], [b]) => a.localeCompare(b));
  const body = sorted.map(([k, v]) => `  ${JSON.stringify(k)}: { hash: "${v.hash}", seconds: ${v.seconds} },`).join("\n");
  writeFileSync(manifestPath, [
    "// npm run voice 生成，别手改。key 是作品 id，对应 public/voice/<id>.mp3",
    `export const VOICE_CLIPS: Readonly<Record<string, { readonly hash: string; readonly seconds: number }>> = {${body ? `\n${body}\n` : ""}};`,
    "",
  ].join("\n"));
}

const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("-")));
const wanted = new Map(WORKS.filter((w) => w.intro).map((w) => [w.id, w.intro]));

// 删掉没人念的旧音频：intro 删了、作品删了
for (const id of Object.keys(clips)) if (!wanted.has(id)) delete clips[id];
if (existsSync(voiceDir)) {
  for (const name of readdirSync(voiceDir)) {
    if (name.endsWith(".mp3") && !wanted.has(name.slice(0, -4))) rmSync(join(voiceDir, name));
  }
}

const todo = [...wanted].filter(([id, text]) => {
  if (only.size && !only.has(id)) return false;
  return clips[id]?.hash !== introHash(text) || !existsSync(join(voiceDir, `${id}.mp3`));
});
console.log(`需要配音 ${todo.length} 件（一共 ${wanted.size} 件有 intro）`);

const scratch = join(tmpdir(), "kids-gallery-voice");
mkdirSync(scratch, { recursive: true });
mkdirSync(voiceDir, { recursive: true });

let failed = 0;
for (const [id, text] of todo) {
  const raw = join(scratch, `${id}.raw.mp3`);
  const out = join(voiceDir, `${id}.mp3`);
  try {
    for (let attempt = 1; ; attempt += 1) {
      try {
        const pitch = NIAN_VOICE.pitch ? [`--pitch=${NIAN_VOICE.pitch}`] : [];
        await run("python", ["-m", "edge_tts", "--voice", NIAN_VOICE.voice, `--rate=${NIAN_VOICE.rate}`, ...pitch, "--text", text, "--write-media", raw]);
        break;
      } catch (error) {
        if (attempt >= 4) throw error;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    await run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-ac", "1", "-ar", "24000", "-b:a", "32k", out]);
    rmSync(raw, { force: true });
    const seconds = Number((await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out])).trim());
    clips[id] = { hash: introHash(text), seconds: Math.round(seconds * 100) / 100 };
    console.log(`public/voice/${id}.mp3（${clips[id].seconds} 秒）`);
  } catch (error) {
    failed += 1;
    console.error(`✖ ${id}: ${error.message}`);
  }
}
save();
if (failed) {
  console.error(`失败 ${failed} 件，再跑一次会只补失败的`);
  process.exitCode = 1;
}
