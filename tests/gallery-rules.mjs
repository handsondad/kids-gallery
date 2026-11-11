// 作品内容检查：字数、日子、署名、照片（大小、拍摄信息）、字体缺不缺字。
// 用法：
//   npm run check
//   npm run check -- clay-flower
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CHARS_FILE, needsGalleryFont } from "../tools/font/subset.mjs";
import { photoIssues } from "../tools/photo.mjs";
import { CREATOR_IDS, KINDS } from "../src/work/vocab.ts";
import { introHash } from "../src/work/voice.ts";
import { VOICE_CLIPS } from "../src/work/voice-manifest.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const worksDir = join(root, "src/works");

const LIMITS = {
  title: 12,
  about: 40,
  said: 40,
  intro: 60,
  alt: 40,
  medium: 10,
  label: 8,
};

const chars = (text) => [...text].length;

/** 返回问题列表，空数组表示通过 */
export function checkWork(work) {
  const problems = [];
  const say = (where, text) => problems.push(`${work.id} ${where}：${text}`);

  if (!/^[a-z][a-z0-9-]*$/.test(work.id)) say("id", "只能用小写字母、数字和短横线，且以字母开头");
  for (const key of ["title", "about", "alt", "medium"]) {
    if (!work[key]?.trim()) say(key, "不能空着");
  }
  for (const key of ["title", "about", "said", "intro", "alt", "medium"]) {
    if (work[key] && chars(work[key]) > LIMITS[key]) say(key, `超过 ${LIMITS[key]} 个字`);
  }

  const day = work.when?.date ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day))) {
    say("时间", "when.date 要写做出来的那天，格式 YYYY-MM-DD");
  } else if (Date.parse(day) > Date.now() + 86400000) {
    say("时间", `${day} 还没到`);
  }
  if (work.when?.approx !== undefined && typeof work.when.approx !== "boolean") say("时间", "when.approx 只能写 true（只记得大概）");
  if (work.when?.label && chars(work.when.label) > LIMITS.label) say("时间", `when.label 不超过 ${LIMITS.label} 个字`);

  if (!KINDS.includes(work.kind)) say("种类", `没有 ${work.kind}，只能是 ${KINDS.join(" / ")}`);

  const by = work.by ?? [];
  if (!by.includes("nian")) say("署名", "by 里要有小念：这是小念的画廊");
  for (const id of by) {
    if (!CREATOR_IDS.includes(id)) say("署名", `by 里不能写「${id}」，只能是 ${CREATOR_IDS.join(" / ")}`);
  }
  if (new Set(by).size !== by.length) say("署名", "by 里有重复的人");

  if (work.story !== undefined && !/^[a-z][a-z0-9-]*$/.test(work.story)) say("story", "写漫画书里故事的 id，比如 wrong-museum");

  if (!/^[\w-]+\.(jpg|png)$/.test(work.photo ?? "")) {
    say("照片", "photo 写 public/works/<id>/ 下的文件名，只收 .jpg / .png");
  } else {
    const file = join(root, "public/works", work.id, work.photo);
    if (!existsSync(file)) say("照片", `找不到 public/works/${work.id}/${work.photo}，跑 npm run photo -- ${work.id} <照片>`);
    else for (const p of photoIssues(readFileSync(file))) say("照片", p);
  }

  if (!existsSync(join(worksDir, work.id, "notes.md"))) say("记录", `缺 src/works/${work.id}/notes.md`);

  if (VOICE_CLIPS[work.id] && !existsSync(join(root, "public/voice", `${work.id}.mp3`))) {
    say("配音", `缺 public/voice/${work.id}.mp3，跑 npm run voice -- ${work.id}`);
  }

  const text = [work.title, work.about, work.said ?? "", work.intro ?? "", work.alt, work.medium, work.when?.label ?? ""].join("");
  const missing = [...new Set([...text].filter((ch) => needsGalleryFont(ch) && !fontChars.has(ch)))];
  if (missing.length) say("字体", `缺这些字：${missing.join("")}，跑 npm run font`);

  return problems;
}

const fontChars = new Set(existsSync(CHARS_FILE) ? readFileSync(CHARS_FILE, "utf8") : "");

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const ids = only.length
    ? only
    : readdirSync(worksDir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name);

  const { WORKS } = await import("../src/works/index.ts");
  let failed = 0;
  let unvoiced = 0;
  for (const id of ids) {
    try {
      const work = (await import(pathToFileURL(join(worksDir, id, "work.ts")).href)).default;
      if (work.intro && VOICE_CLIPS[id]?.hash !== introHash(work.intro)) unvoiced++;
      const problems = checkWork(work);
      if (work.id !== id) problems.unshift(`${id}：目录名和 work.id（${work.id}）不一致`);
      if (!WORKS.includes(work)) problems.push(`${id}：没登记到 src/works/index.ts`);
      if (problems.length) {
        console.error(`✗ ${id}`);
        for (const p of problems) console.error(`  - ${p}`);
        failed++;
      } else {
        console.log(`✓ ${id}`);
      }
    } catch (err) {
      console.error(`✗ ${id}：${err.message}`);
      failed++;
    }
  }
  // 没配音不算错：页面上只是没有播放按钮。要发布就跑一下
  if (unvoiced) console.log(`提示：${unvoiced} 件的 intro 还没配音或改过字，跑 npm run voice`);
  if (failed) process.exit(1);
}

const entry = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href;
if (entry === import.meta.url) main();
