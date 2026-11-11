/** 作品种类。加新种类要同时加中文名 */
export const KINDS = ["draw", "craft"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_NAMES: Record<Kind, string> = { draw: "画画", craft: "手工" };

/**
 * 能署名的人：和《小念家的漫画书》一样，只有小念、爸爸、妈妈。
 * 画廊是小念的，所以每件作品都要有小念；大人帮忙了才加上。
 */
export const CREATOR_IDS = ["nian", "dad", "mom"] as const;
export type CreatorId = (typeof CREATOR_IDS)[number];
export const CREATOR_NAMES: Record<CreatorId, string> = { nian: "小念", dad: "爸爸", mom: "妈妈" };

/** 「小念做的」「小念和妈妈一起做的」「小念、爸爸和妈妈一起做的」 */
export function creditLine(by: readonly CreatorId[]): string {
  const names = CREATOR_IDS.filter((id) => by.includes(id)).map((id) => CREATOR_NAMES[id]);
  if (names.length <= 1) return `${names[0] ?? "小念"}做的`;
  return `${names.slice(0, -1).join("、")}和${names[names.length - 1]}一起做的`;
}
