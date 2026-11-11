---
name: kids-gallery-curate
description: >-
  Guides adding one of Nian's artworks to the kids-gallery repo: check the photo
  for privacy, run work:new / photo, chat with the child one question at a time,
  write notes.md and work.ts, run check and snapshot, and publish. Use when
  adding or revising an artwork, photo, title, credits or notes, or when the
  user mentions 新作品、收进画廊、作品照片、小念画的、小念做的、notes.md.
---

# 小念的画廊：收一件新作品

目标：作品是小念的，名字和话也尽量是小念的。大人（和 agent）负责拍好、记下、守住隐私，把它挂上绳子。

仓库结构、命令、硬性规矩见根目录 `AGENTS.md`。

## 七步

每一步都要大人点头才往下走。和孩子聊时一次只问一个问题。

```
- [ ] 1. 看照片：能不能公开 → 放 private/
- [ ] 2. npm run work:new -- <id> private/<照片>
- [ ] 3. 和小念聊 → notes.md
- [ ] 4. 写 work.ts → npm run check -- <id>
- [ ] 5. npm run font
- [ ] 6. 写「小念讲」→ 念给他听 → npm run voice -- <id>
- [ ] 7. npm run snapshot -- home <id>（再加 --width 390 看手机）
- [ ] 8. typecheck / test / build，推到 main 发布
```

### 1. 看照片

先打开照片看，有下面任何一样就停下来问大人，裁掉或换一张：

- 小念的脸，或者别的小朋友
- 校服、校徽、幼儿园名字、班级牌、门牌、快递单
- 家里能认出位置的窗外景色

原图放 `private/`，它在 `.gitignore` 里。手机的 HEIC 先导出成 JPG。

### 2. 建目录

```bash
npm run work:new -- <id> private/<照片>.jpg
```

id 按作品起，小写英文和短横线：`rainbow-fish`、`moon-car`。照片会被转正、缩到长边 1600、存成 `public/works/<id>/photo.jpg`，拍摄时间和 GPS 都去掉了。之后要换照片：`npm run photo -- <id> <照片>`。

### 3. 和小念聊

建议按这个顺序问，每次只问一句，原话记进 `src/works/<id>/notes.md` 的「小念说」：

1. 这个叫什么名字？（他起的名字就是 `title`）
2. 画的是谁 / 是什么？
3. 你最喜欢哪一块？为什么用这个颜色？
4. 是哪天做的？在哪儿？（不知道就问大人，别猜）
5. 谁和你一起做的？

他不想说就不问了。没说的不要编：`said` 空着比替他编一句好。

### 4. 写 work.ts

```ts
const work: Work = {
  id: "rainbow-fish",
  title: "彩虹鱼",                       // ≤12 字，最好是小念起的
  about: "下雨天在家，用蜡笔画了一条会变色的鱼。",   // ≤40 字，大人写来历
  said: "它游到哪儿，水就变成什么颜色。",            // ≤40 字，小念原话，一字不改
  intro: "下雨天不能出去，我就画了一条彩虹鱼。它身上有七种颜色，游到哪儿哪儿就亮了！",  // ≤60 字，小念的口吻，见下面
  when: { date: "2026-09-12", label: "下雨天" },    // 做出来的那天；label ≤8 字
  kind: "draw",                          // draw 画画 | craft 手工
  medium: "油画棒",                      // ≤10 字
  by: ["nian"],                          // 必须有 nian；大人一起动手才加 dad / mom
  photo: "photo.jpg",
  alt: "蓝色的纸上一条彩色条纹的大鱼，周围有泡泡",  // ≤40 字，照片上是什么
  // story: "wrong-museum",              // 同一天漫画书里有故事才写
};
```

- 公开场所可以写（美术馆、公园）；学校、幼儿园、公司的名字写进 notes.md 的「不写的」，不进 `work.ts`
- 同一天在《小念家的漫画书》里有故事，`story` 写那个故事的 id，作品页会出现「那天的故事」按钮

跑 `npm run check -- <id>`，检查器管：字数、日子格式、署名、种类、照片在不在、有没有拍摄信息、太大没有、缺不缺字。

### 6. 小念讲（intro）

作品页上那个黄气泡，点「▶ 听小念讲」用小念的声音念出来。小念自己说得出来最好；说不全的，大人照 `notes.md` 用他的口吻代写：

- 用「我」，像一个七岁的孩子跟客人介绍：先说是什么，再说最得意的一处，最后一句带点心情
- 短句，一句不超过十来个字；用孩子的词（红脸蛋、黄圈圈、一块一块按上去），不用「色彩丰富」「充满想象力」这种大人的词
- 只写真发生过的事和照片上看得到的东西，不编情节
- ≤60 字，念出来十几秒

写完念给小念听，他点头了（或者照他改的字改），在 `notes.md` 的「小念讲」下面记一笔，再配音：

```bash
npm run voice -- <id>      # 改了字重跑，只会重配改过的
```

### 7～8. 字体、截图、发布

```bash
npm run font                              # 加了新汉字时
npm run snapshot -- home <id>
npm run snapshot -- home <id> --width 390
npm run typecheck && npm test && npm run build
```

打开 `snapshots/` 看：

- 绳子上的新作品夹在对的日子上，缩略图认得出是什么
- 作品页照片是正的（没有横过来），没有脸和校名
- 手机宽度下字没有挤出框

看完把 `snapshots/` 丢掉（已在 `.gitignore`）。推到 `main` 就会发布。

## 验收

- `npm run check` 无报错
- 照片里没有脸、校名、住址
- `said` 是小念的原话，或者空着
- `intro` 小念听过、点了头；作品页能点开听
- 手机宽度下能看清、能左右换
