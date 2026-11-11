import type { Work } from "../../work/types.ts";

const work: Work = {
  id: "pink-butterfly",
  title: "粉蝴蝶",
  about: "给纸蝴蝶的翅膀涂上蜡笔，粘在一根绿色小棍上。",
  intro: "我用蜡笔给蝴蝶的翅膀涂上粉粉的颜色，下面有一根绿色的棍子，举起来它就会飞啦！",
  when: { date: "2026-10-24" },
  kind: "draw",
  medium: "蜡笔",
  by: ["nian", "laoye"],
  photo: "photo.jpg",
  alt: "粘在绿色小棍上的纸蝴蝶，四片翅膀涂着粉色和橙色的蜡笔",
};

export default work;
