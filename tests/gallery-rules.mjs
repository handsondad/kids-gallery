// 作品内容检查：字数、日子、署名、照片（大小、拍摄信息）、字体缺不缺字。
// 用法：
//   npm run check
//   npm run check -- clay-flower
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CHARS_FILE, needsGalleryFont } from "../tools/font/subset.mjs";
import { inspectPhoto, photoIssues, PHOTO, THUMB } from "../tools/photo.mjs";
import { CREATOR_IDS, KINDS } from "../src/work/vocab.ts";
import { introHash } from "../src/work/voice.ts";
import { VOICE_CLIPS } from "../src/work/voice-manifest.ts";
import { PHOTO_SIZES } from "../src/work/photo-manifest.ts";

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

/** npm run work:new 写进 work.ts 的占位字；还是这几个字说明忘了改 */
export const TEMPLATE_TEXT = {
  title: "新作品",
  about: "一句话来历。",
  alt: "照片上是什么",
};

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
  for (const [key, text] of Object.entries(TEMPLATE_TEXT)) {
    if (work[key]?.trim() === text) say(key, `还是 work:new 的占位字「${text}」，改成这件作品的`);
  }
  if (work.heard !== undefined && work.heard !== true) say("小念讲", "heard 只能写 true（小念听过、点头了）");
  if (work.heard && !work.intro) say("小念讲", "没有 intro，heard 就不用写");

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
    else {
      const buf = readFileSync(file);
      for (const p of photoIssues(buf)) say("照片", p);
      const info = inspectPhoto(buf);
      const known = PHOTO_SIZES[work.id];
      if (info && (known?.width !== info.width || known?.height !== info.height)) {
        say("照片", `src/work/photo-manifest.ts 里的宽高对不上，跑 npm run photo -- --thumbs ${work.id}`);
      }
    }
    const thumb = join(root, "public/works", work.id, THUMB);
    if (!existsSync(thumb)) say("缩略图", `缺 public/works/${work.id}/${THUMB}，跑 npm run photo -- --thumbs ${work.id}`);
    else {
      const buf = readFileSync(thumb);
      for (const p of photoIssues(buf)) say("缩略图", p);
      if (buf.length > PHOTO.thumbMaxBytes) say("缩略图", `${(buf.length / 1024).toFixed(0)} KB 太大，跑 npm run photo -- --thumbs ${work.id}`);
    }
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
  const unheard = [];
  for (const id of ids) {
    try {
      const work = (await import(pathToFileURL(join(worksDir, id, "work.ts")).href)).default;
      if (work.intro && VOICE_CLIPS[id]?.hash !== introHash(work.intro)) unvoiced++;
      if (work.intro && !work.heard) unheard.push(id);
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
  if (unheard.length) console.log(`提示：${unheard.length} 件的「小念讲」小念还没听过，念给他听，点头了在 work.ts 加 heard: true：${unheard.join("、")}`);
  if (failed) process.exit(1);
}

const entry = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href;
if (entry === import.meta.url) main();
