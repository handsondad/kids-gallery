import type { Work } from "../work/types.ts";
import clayMittens from "./clay-mittens/work.ts";
import yellowChick from "./yellow-chick/work.ts";
import cupMonster from "./cup-monster/work.ts";
import paperHedgehog from "./paper-hedgehog/work.ts";
import dotChick from "./dot-chick/work.ts";
import catFan from "./cat-fan/work.ts";
import pinkButterfly from "./pink-butterfly/work.ts";
import clayTurtle from "./clay-turtle/work.ts";
import midAutumnBunny from "./mid-autumn-bunny/work.ts";
import mooncakeBunnyBag from "./mooncake-bunny-bag/work.ts";
import paperLollipop from "./paper-lollipop/work.ts";
import googlyMonsters from "./googly-monsters/work.ts";
import leafLion from "./leaf-lion/work.ts";
import paperButterfly from "./paper-butterfly/work.ts";
import foamWreath from "./foam-wreath/work.ts";
import operaMask from "./opera-mask/work.ts";
import clayFlower from "./clay-flower/work.ts";

/** 画廊里的作品，按收进来的先后排；首页按 when.date 重新排 */
export const WORKS: readonly Work[] = [operaMask, clayFlower, foamWreath, paperButterfly, leafLion, googlyMonsters, paperLollipop, mooncakeBunnyBag, midAutumnBunny, clayTurtle, pinkButterfly, catFan, dotChick, paperHedgehog, cupMonster, yellowChick, clayMittens];

export function workById(id: string): Work | undefined {
  return WORKS.find((w) => w.id === id);
}

/** 照片地址：相对路径，部署在子路径下也能用 */
export const photoUrl = (work: Work) => `works/${work.id}/${work.photo}`;

/** 缩略图：短边 360，首页绳子上的小方块和照片墙用，npm run photo 一起出 */
export const thumbUrl = (work: Work) => `works/${work.id}/thumb.jpg`;

/** 《小念家的漫画书》里同一天的故事 */
export const storyUrl = (id: string) => `https://handsondad.github.io/storyverse/#/read/${id}/0`;
