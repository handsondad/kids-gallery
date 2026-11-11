import type { Work } from "../work/types.ts";
import operaMask from "./opera-mask/work.ts";
import clayFlower from "./clay-flower/work.ts";

/** 画廊里的作品，按收进来的先后排；首页按 when.date 重新排 */
export const WORKS: readonly Work[] = [operaMask, clayFlower];

export function workById(id: string): Work | undefined {
  return WORKS.find((w) => w.id === id);
}

/** 照片地址：相对路径，部署在子路径下也能用 */
export const photoUrl = (work: Work) => `works/${work.id}/${work.photo}`;

/** 《小念家的漫画书》里同一天的故事 */
export const storyUrl = (id: string) => `https://handsondad.github.io/storyverse/#/read/${id}/0`;
