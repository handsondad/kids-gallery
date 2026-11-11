import type { Work } from "../../work/types.ts";

const work: Work = {
  id: "opera-mask",
  title: "京剧脸谱",
  about: "六一儿童节在工艺美术馆的亲子活动上，和爸爸妈妈一起给白脸谱涂上了鲜艳的颜色。",
  intro: "六一那天，我和爸爸妈妈给白脸谱涂上了颜色。红脸蛋，绿眼圈，橙下巴，额头上还有黄圈圈。我们先走错了美术馆，差点赶不上呢！",
  when: { date: "2026-06-01", label: "六一儿童节" },
  kind: "craft",
  medium: "脸谱彩绘",
  by: ["nian", "dad", "mom"],
  photo: "photo.jpg",
  alt: "红脸、绿眼圈、橙色下巴的京剧脸谱，额头上画着黄色的圆圈",
  story: "wrong-museum",
};

export default work;
