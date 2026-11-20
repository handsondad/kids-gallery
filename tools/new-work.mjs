// 新收一件作品：建目录骨架，登记到 src/works/index.ts；给了照片就顺便处理好。
// 用法：npm run work:new -- <id> [照片路径]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATE_TEXT } from "../tests/gallery-rules.mjs";
import { processPhoto, sourceMime } from "./photo.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [id, photo] = process.argv.slice(2);

if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) {
  console.error("用法：npm run work:new -- <id> [照片路径]（id 用小写字母、数字、短横线）");
  process.exit(1);
}

const dir = join(root, "src/works", id);
if (existsSync(dir)) {
  console.error(`已存在：src/works/${id}`);
  process.exit(1);
}

// 照片不对就什么都不建，免得留下半个作品
if (photo) {
  try {
    sourceMime(resolve(photo));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

const today = new Date();
const date = [today.getFullYear(), today.getMonth() + 1, today.getDate()].map((n) => String(n).padStart(2, "0")).join("-");
const dateText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日`;
const photoNote = photo ? `原图在 \`${relative(root, resolve(photo)).replaceAll("\\", "/")}\`` : "还没有照片";

mkdirSync(dir, { recursive: true });
// 和 curate skill 里 notes.md 的几段一一对应
writeFileSync(join(dir, "notes.md"), `# ${id}

## 那天的事（${dateText}）

- 
- 谁一起做的还不知道，先只写小念；大人说了再补 \`by\`

## 照片

- ${photoNote}

## 日子

- （做出来的那天是怎么知道的；只记得大概就写怎么定的，work.ts 加 approx: true）

## 小念说

- （还没记）

## 小念讲（intro）

- （谁写的；念给小念听过没有，点头了在 work.ts 加 heard: true）

## 不写的

- 
`);

writeFileSync(join(dir, "work.ts"), `import type { Work } from "../../work/types.ts";

const work: Work = {
  id: "${id}",
  title: "${TEMPLATE_TEXT.title}",
  about: "${TEMPLATE_TEXT.about}",
  // said: "小念的原话，不改字",
  // intro: "用小念的口吻介绍，≤60 字；念给他听过再 npm run voice",
  // heard: true, // 小念听过 intro、点头了
  // 做出来的那天，首页时间绳按这个排
  when: { date: "${date}" },
  kind: "draw",
  medium: "蜡笔",
  by: ["nian"],
  photo: "photo.jpg",
  alt: "${TEMPLATE_TEXT.alt}",
};

export default work;
`);

const indexPath = join(root, "src/works/index.ts");
let index = readFileSync(indexPath, "utf8");
if (!index.includes(`./${id}/work.ts`)) {
  const importName = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
  index = index.replace(
    /import type \{ Work \} from "\.\.\/work\/types\.ts";(\r?\n)/,
    (_m, eol) => `import type { Work } from "../work/types.ts";${eol}import ${importName} from "./${id}/work.ts";${eol}`,
  );
  index = index.replace(
    /export const WORKS: readonly Work\[\] = \[([^\]]*)\]/,
    (_m, list) => {
      const items = list.trim() ? list.trim().replace(/,?$/, ",") + ` ${importName}` : importName;
      return `export const WORKS: readonly Work[] = [${items}]`;
    },
  );
  writeFileSync(indexPath, index);
}

console.log(`已创建 src/works/${id}/`);
if (photo) {
  try {
    await processPhoto(id, resolve(photo));
    console.log(`照片已处理：public/works/${id}/photo.jpg`);
  } catch (err) {
    console.error(`照片没处理好：${err.message}`);
    console.error(`目录已经建好了，修好后跑：npm run photo -- ${id} <照片路径>`);
    process.exit(1);
  }
} else {
  console.log(`还没有照片：npm run photo -- ${id} <照片路径>`);
}
console.log(`下一步：改 work.ts → npm run check -- ${id} → npm run font → npm run snapshot -- home ${id}`);
