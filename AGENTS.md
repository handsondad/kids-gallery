# AGENTS.md：给接手这个仓库的代码助手

## 这是什么

「小念的画廊」：小念自己的作品墙。他画的画、做的手工拍成照片，和那天的小故事一起收进仓库，发布到 GitHub Pages。没有后端，没有上传表单；作品是 `src/works/` 里的 TypeScript 数据，照片在 `public/works/`。

和《小念家的漫画书》（[storyverse](https://github.com/handsondad/storyverse)）、《身体奇遇记》是同一个系列：同一个小念，同一套颜色、字体和首页晾衣绳。同一天在漫画书里有故事的，作品页会链过去。

技术栈：React 18 + TypeScript（strict）+ Vite 5。Hash 路由，相对路径资源，部署在任意子路径下都能打开。

**收新作品之前，先读 `skills/kids-gallery-curate/SKILL.md`。**

## 命令

需要 Node.js 22+。测试和脚本直接用 Node 跑 `.ts` 文件。

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | 全部测试 |
| `npm run check [-- <作品id>]` | 检查作品内容和照片 |
| `npm run work:new -- <id> [照片]` | 新收一件作品（建目录、登记、处理照片） |
| `npm run photo -- <id> <照片>` | 换照片：转正、缩到长边 1600、去掉拍摄信息 |
| `npm run snapshot [-- home <id>...] [--width 390]` | 截成 PNG，放在 `snapshots/` |
| `npm run font` | 按源码里用到的字重新截取字体 |
| `npm run voice [-- <作品id>]` | 用 edge-tts 给 `intro` 配上小念的声音（只配新的和改过字的） |
| `npm run build` | 生产构建，输出到 `dist/` |

交付前四个都要过：`npm run typecheck`、`npm test`、`npm run check`、`npm run build`。新作品还要 `npm run snapshot` 自己看一遍图，手机宽度（`--width 390`）也看。

## 地图

| 路由 | 页面 | 文件 |
|---|---|---|
| `#/` | 首页时间绳（年 → 月 → 作品一层层折叠，按 `work.when.date` 排，位置在 `src/pages/timeline.ts`） | `src/pages/WallPage.tsx` |
| `#/work/<id>` | 一件作品的大图和小故事，← → 换一件 | `src/pages/WorkPage.tsx` |

内容和工具：

- `src/works/<id>/work.ts`：一件作品一份数据，类型在 `src/work/types.ts`
- `src/works/<id>/notes.md`：那天的事、小念的原话、哪些不能写；不进页面
- `src/works/index.ts`：作品列表、照片地址、漫画书链接
- `src/work/vocab.ts`：作品种类、能署名的人、署名那句话
- `src/work/voice.ts`：小念的声音和配音指纹，「听小念讲」按钮和配音工具共用
- `src/pages/IntroBubble.tsx`：「小念讲」气泡和播放按钮（配过音、字没改过才出按钮）
- `tools/voice.mjs`：配音，输出 `public/voice/<作品id>.mp3` 和 `src/work/voice-manifest.ts`（生成的，别手改）
- `public/works/<id>/photo.jpg`：处理过的照片
- `public/fonts/gallery.woff`：站酷快乐体子集（OFL）
- `tools/photo.mjs`：用本机浏览器的画布重画照片，顺便去掉 Exif；也给检查器读宽高和拍摄信息
- `tools/snapshot.mjs`：无头浏览器截 PNG
- `tests/gallery-rules.mjs`：内容检查器

旧的「小小星光」版本（虚构的示例作品、浏览器里上传存 localStorage）在 `a2d486d` 之前的历史里。

## 收一件新作品

1. 照片先放 `private/`（不进仓库），看一眼：没有小念的脸、校服校徽、园名、门牌
2. `npm run work:new -- <id> private/xxx.jpg`（id 用小写英文和短横线，按作品起，比如 `rainbow-fish`）
3. 和小念聊，记进 `notes.md`（见 curate skill）
4. 写 `work.ts`，跑 `npm run check -- <id>` 直到通过
5. `npm run font`（加了新汉字就要跑）
6. `intro` 念给小念听过、他点头了，跑 `npm run voice -- <id>`（要联网，需要 `python -m pip install edge-tts` 和 ffmpeg）
7. `npm run snapshot -- home <id>` 和 `npm run snapshot -- home <id> --width 390`，打开 `snapshots/` 看图
8. `npm run typecheck && npm test && npm run build`

## 硬性规矩

- **署名**：`by` 只能是 `nian` / `dad` / `mom` / `laoye`（`CREATOR_IDS`，姥爷），而且必须有 `nian`：这是小念的画廊。大人真的一起动手了才加上，不清楚就只写小念。不写家里人的真名。
- **孩子的隐私**：
  - 不写真名、学校和幼儿园的名字、住址、班级、老师名字；公开场所（美术馆、公园）可以写。
  - 照片里不出现小念的脸和别的小朋友；有就裁掉或换一张，原图留在 `private/`。
  - 照片一律经过 `npm run photo`（或 `work:new` 带照片），检查器会拦带 Exif 的照片：里面可能有拍摄时间和 GPS。
  - 不确定能不能公开，先问大人。
- **小念的原话**：`said` 一字不改；没问到就不写，不要替他编。大人的话写进 `about`。
- **小念讲（`intro`）**：用小念的口吻介绍作品，可以由大人照 `notes.md` 代写，但只写真发生过的事；短句、孩子的说法（「我」「红脸蛋」「差点赶不上呢」），≤60 字。写完念给小念听，他点头才配音发布；在 `notes.md` 里记一笔是谁写的、他听过没有。
- **配音**：只用合成的声音，小念是 `zh-CN-YunxiaNeural`，和漫画书同一个（`src/work/voice.ts`）。小念自己录的声音放 `private/`，要公开先问大人。
- **日子**：`when.date` 写做出来的那天；不知道就问，别猜。大人只记得大概的，加 `approx: true`（页面只显示到月），怎么定的写进 `notes.md`。同一天漫画书里有故事，写 `story: "<故事id>"`。
- **素材许可**：站酷快乐体是 OFL；新素材要在 `THIRD_PARTY_NOTICES.md` 写明来源。
- **代码风格**：照周围代码写。中文注释只写代码本身表达不了的约束；改动要小而完整。

## 已知的坑

- **`.ts` 扩展名**：Node 直接跑 `.ts`，所以被测试导入的文件相互导入时要写 `.ts` 扩展名。`tsconfig` 开了 `allowImportingTsExtensions`。
- **字体缺字**：页面上出现方框，跑 `npm run font` 再刷新。需要 `python -m pip install fonttools`。
- **截图和处理照片要用本机 Edge/Chrome**：`puppeteer-core` 不自带浏览器；找不到时设环境变量 `BROWSER_PATH`。
- **HEIC**：浏览器解不开手机的 HEIC，先导出成 JPG。
- **改了 `intro` 没重配**：播放按钮会自己藏起来（指纹对不上），`npm run check` 会提示，跑 `npm run voice` 就好。
