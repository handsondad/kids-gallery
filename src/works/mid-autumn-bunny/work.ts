import type { Work } from "../../work/types.ts";

const work: Work = {
  id: "mid-autumn-bunny",
  title: "中秋小兔",
  about: "中秋节的小海报：给小兔子涂上蓝色和红色，旁边有黄月亮和祝福的话。",
  intro: "中秋节，我给小兔子涂上蓝色和红色，旁边有一个黄黄的大月亮。上面写着中秋快乐、平安喜乐！",
  when: { date: "2026-09-25", label: "中秋节" },
  kind: "draw",
  medium: "颜料涂色",
  by: ["nian", "mom"],
  photo: "photo.jpg",
  alt: "涂满蓝色和红色的兔子，旁边写着中秋快乐、平安喜乐，右上角一个黄月亮",
};

export default work;
