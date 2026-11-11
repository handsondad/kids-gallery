# 小念的画廊

小念画的画、做的手工，按做出来的日子夹在一根晾衣绳上。每件作品有一段「小念讲」，点一下就用小念的声音念出来。作品是仓库里的 TypeScript 数据和处理过的照片，推到 `main` 就发布到 GitHub Pages——没有后端，没有上传表单。

线上地址：<https://handsondad.github.io/kids-gallery/>

和 [小念家的漫画书](https://github.com/handsondad/storyverse)、[身体奇遇记](https://github.com/handsondad/bodyverse) 是同一个系列：同一个小念，同一套颜色、字体、配音和首页晾衣绳。同一天在漫画书里有故事的作品，会链到那个故事。

## 页面

| 路由 | 看什么 |
|---|---|
| `#/` | 时间绳：作品像拍立得一样夹在绳子上，跨年挂年份旗；点一件，下面出预览和「小念讲」 |
| `#/work/<id>` | 一件作品的大图、日子、谁做的、「▶ 听小念讲」；← → 或左右滑动换一件，Esc 回首页 |

现在收着：

| 作品 | 日子 | 谁做的 |
|---|---|---|
| 京剧脸谱 | 2026-06-01 六一儿童节 | 小念、爸爸和妈妈（漫画书里有那天的《走错美术馆》） |
| 五彩的花 | 2026-07-02 幼儿园亲子活动 | 小念和妈妈 |

## 本地运行

需要 Node.js 22+。

```bash
npm install
npm run dev
```

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run typecheck` | 类型检查 |
| `npm test` | 测试 |
| `npm run check` | 检查作品内容、照片和配音 |
| `npm run work:new -- <id> [照片]` | 新收一件作品 |
| `npm run photo -- <id> <照片>` | 换照片（转正、缩小、去掉拍摄信息） |
| `npm run voice` | 给「小念讲」配音（edge-tts，只配新的和改过字的） |
| `npm run font` | 重新截取字体子集 |
| `npm run snapshot` | 截成 PNG（加 `--width 390` 看手机） |
| `npm run build` | 生产构建 |

只看页面、改代码用不着别的。收新作品时还要：

- 本机的 Edge 或 Chrome（处理照片、截图）
- `python -m pip install fonttools`（`npm run font`）
- `python -m pip install edge-tts` 和 ffmpeg（`npm run voice`，要联网）

## 收一件新作品

见 [AGENTS.md](AGENTS.md) 和 [skills/kids-gallery-curate/SKILL.md](skills/kids-gallery-curate/SKILL.md)。

简单说：

1. 照片放 `private/`（不进仓库），确认没有脸、校名、门牌
2. `npm run work:new -- <id> private/<照片>.jpg`
3. 和小念聊，记进 `src/works/<id>/notes.md`；写 `work.ts`，`npm run check -- <id>`
4. 写「小念讲」（`intro`），念给小念听，他点头了 `npm run voice -- <id>`
5. `npm run font`，`npm run snapshot -- home <id>` 看图
6. `npm run typecheck && npm test && npm run build`，推到 `main`

`said` 只放小念的原话；`intro` 可以由大人照着真事、用他的口吻代写。

## 部署

推送到 `main` 后，`.github/workflows/deploy.yml` 会跑测试、检查、构建，并发布到 GitHub Pages。仓库 Settings → Pages 的 Source 选 **GitHub Actions**。

## 目录

| 位置 | 内容 |
|---|---|
| `src/works/` | 作品数据（`work.ts`）和聊天记录（`notes.md`） |
| `src/work/` | 作品类型、词表、配音指纹 |
| `src/pages/` | 首页时间绳、作品页、「小念讲」气泡 |
| `public/works/` | 处理过的照片 |
| `public/voice/` | 「小念讲」的配音 |
| `public/fonts/` | 站酷快乐体子集 |
| `tools/` | 新建作品、处理照片、配音、截图、字体 |
| `tests/` | 测试和内容检查器 |
| `skills/` | 给代码助手的收作品说明 |

旧的「小小星光」版本（虚构的示例作品、浏览器里上传）在提交 `a2d486d` 及之前的历史里。

## 许可

代码 MIT（待补完整声明）。字体：站酷快乐体（OFL），子集在 `public/fonts/`；配音由微软 Edge 在线语音生成，只按家庭和非商业用途，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。作品照片版权归小念家，家庭和非商业使用。署名用角色名（小念、爸爸、妈妈），不要写家里人的真名。
