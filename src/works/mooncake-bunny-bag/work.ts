import type { Work } from "../../work/types.ts";

const work: Work = {
  id: "mooncake-bunny-bag",
  title: "月饼兔子袋",
  about: "中秋节的无纺布小手提袋，给上面的小兔子和月饼涂上颜色。",
  intro: "中秋节的小袋子上有一只小兔子，我给它的耳朵涂上黄绿色，月饼涂成橙色的。可以装月饼！",
  when: { date: "2026-09-25", label: "中秋节" },
  kind: "draw",
  medium: "布袋涂色",
  by: ["nian", "laoye"],
  photo: "photo.jpg",
  alt: "绿提手的白色布袋，上面一只眨眼的小兔子趴在橙色月饼后面",
};

export default work;
