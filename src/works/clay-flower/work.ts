import type { Work } from "../../work/types.ts";

const work: Work = {
  id: "clay-flower",
  title: "五彩的花",
  about: "第一次参加幼儿园的亲子活动，和妈妈一起贴出了这朵五彩的花。",
  intro: "这是我和妈妈在幼儿园做的花。我把彩泥一块一块按在纸上，绿的、紫的、蓝的、红的、黄的、橙的，每片花瓣都不一样！",
  when: { date: "2026-07-02", label: "幼儿园亲子活动" },
  kind: "craft",
  medium: "彩泥拼贴",
  by: ["nian", "mom"],
  photo: "photo.jpg",
  alt: "白纸上用绿、紫、蓝、红、黄、橙六种彩泥贴成的花瓣，花心是印着格子的黄色圆片",
};

export default work;
