/**
 * 首页的时间绳：年 → 月 → 一件件作品，点一层展开一层（照《小念的自然图鉴》按分类的挂法）。
 * 收着的年、月是一张牌子（几张小照片 + 几件），点开变成一面旗，后面跟着它里面的东西；同一层一次只开一个。
 * 只有一件的月份不成组，直接挂那一件；一年只有一个月时跳过月这一层，免得点开只看到一个牌子。
 * 绳子是一条二次贝塞尔曲线，两头高、中间垂下去；挂件的高度跟着绳子走。
 * 绳子比屏幕长就左右滑（滚动条藏起来）。和《小念家的漫画书》首页是同一根绳子，只是挂的是照片。
 */
import type { Work } from "../work/types.ts";

export type LineSize = {
  readonly tagW: number;
  readonly bundleW: number;
  readonly flagW: number;
  readonly gap: number;
  /** 两头留给立杆 */
  readonly pad: number;
  /** 绳子中间垂下多少 */
  readonly sag: number;
  /** 绳子两头的高度 */
  readonly top: number;
  /** 整根绳子连挂件有多高 */
  readonly rowH: number;
};

export const LINE: LineSize = { tagW: 150, bundleW: 150, flagW: 88, gap: 26, pad: 64, sag: 36, top: 28, rowH: 296 };
/** 手机上挂件小一号 */
export const COMPACT: LineSize = { tagW: 116, bundleW: 116, flagW: 72, gap: 14, pad: 40, sag: 24, top: 24, rowH: 250 };
export const sizeFor = (room: number): LineSize => (room > 0 && room < 560 ? COMPACT : LINE);

const TILTS = [-3, 2.5, -1.5, 3, -2.5, 1.5];
const COLORS = ["#ffe3c2", "#d9ecff", "#dff5e8", "#ffe0ea", "#efe4ff", "#fff2b8"];

export const byDate = (a: Work, b: Work) => a.when.date.localeCompare(b.when.date) || a.id.localeCompare(b.id);
export const yearOf = (w: Work) => Number(w.when.date.slice(0, 4));

/** 绳子在横坐标 x 处垂下多少（0 是两头的高度） */
export function sagAt(x: number, width: number, size: LineSize = LINE): number {
  const t = Math.min(1, Math.max(0, (x - size.pad / 2) / (width - size.pad)));
  return 4 * size.sag * t * (1 - t);
}

export type Group = {
  readonly kind: "group";
  /** 年是「2026」，月是「2026-09」 */
  readonly key: string;
  readonly level: "year" | "month";
  /** 「2026年」「9月」 */
  readonly name: string;
  /** 从早到晚 */
  readonly works: readonly Work[];
  readonly children: readonly TreeNode[];
};
export type TreeNode = Group | { readonly kind: "leaf"; readonly work: Work };

function bucket(works: readonly Work[], keyOf: (w: Work) => string): Map<string, Work[]> {
  const out = new Map<string, Work[]>();
  for (const w of [...works].sort(byDate)) out.set(keyOf(w), [...(out.get(keyOf(w)) ?? []), w]);
  return out;
}

export function buildTree(works: readonly Work[]): Group[] {
  const leaves = (list: readonly Work[]): TreeNode[] => list.map((work) => ({ kind: "leaf", work }));
  return [...bucket(works, (w) => w.when.date.slice(0, 4))].map(([year, list]): Group => {
    const months = bucket(list, (w) => w.when.date.slice(0, 7));
    const children = months.size === 1 ? leaves(list) : [...months].map(([key, inside]): TreeNode =>
      inside.length === 1 ? { kind: "leaf", work: inside[0] }
        : { kind: "group", key, level: "month", name: `${Number(key.slice(5))}月`, works: inside, children: leaves(inside) });
    return { kind: "group", key: year, level: "year", name: `${year}年`, works: list, children };
  });
}

export type TreeSlot =
  | { readonly kind: "bundle"; readonly group: Group }
  | { readonly kind: "flag"; readonly group: Group }
  | { readonly kind: "work"; readonly work: Work };

/** 按展开的路径把树摊平成绳子上从左到右的挂件：展开的组挂一面旗，后面跟着它里面的东西 */
export function visibleSlots(nodes: readonly TreeNode[], open: readonly string[]): TreeSlot[] {
  return nodes.flatMap((n): TreeSlot[] => {
    if (n.kind === "leaf") return [{ kind: "work", work: n.work }];
    if (!open.includes(n.key)) return [{ kind: "bundle", group: n }];
    return [{ kind: "flag", group: n }, ...visibleSlots(n.children, open)];
  });
}

const within = (key: string, parent: string) => key === parent || key.startsWith(`${parent}-`);

/** 同一层只展开一个：点开一个组，收起它的兄弟；点已经展开的组，连同里面的一起收起 */
export function toggleOpen(open: readonly string[], key: string): string[] {
  if (open.includes(key)) return open.filter((k) => !within(k, key));
  return [...open.filter((k) => within(key, k)), key];
}

export function findGroup(nodes: readonly TreeNode[], key: string): Group | undefined {
  for (const n of nodes) {
    if (n.kind !== "group" || !within(key, n.key)) continue;
    return n.key === key ? n : findGroup(n.children, key);
  }
  return undefined;
}

/** 要看到这一件，得展开哪些组 */
export function pathToWork(nodes: readonly TreeNode[], id: string): string[] {
  for (const n of nodes) {
    if (n.kind !== "group" || !n.works.some((w) => w.id === id)) continue;
    return [n.key, ...pathToWork(n.children, id)];
  }
  return [];
}

/** 要看到这个组，得展开哪些组（含它自己） */
export function pathTo(nodes: readonly TreeNode[], key: string): string[] {
  for (const n of nodes) {
    if (n.kind !== "group" || !within(key, n.key)) continue;
    return n.key === key ? [key] : [n.key, ...pathTo(n.children, key)];
  }
  return [];
}

export type LineItem = { readonly slot: TreeSlot; readonly x: number; readonly y: number; readonly tilt: number; readonly color: string };

/**
 * room：框有多宽；框比挂件宽时绳子拉满，挂件之间稍微松一点，整串居中，不会散得太开。
 */
export function layoutLine(slots: readonly TreeSlot[], room = 0, size: LineSize = LINE): { items: LineItem[]; width: number } {
  const widthOf = (s: TreeSlot) => (s.kind === "bundle" ? size.bundleW : s.kind === "flag" ? size.flagW : size.tagW);
  const content = slots.reduce((sum, s) => sum + widthOf(s), 0) + size.gap * Math.max(0, slots.length - 1);
  const width = Math.max(room, content + size.pad * 2);
  const free = width - size.pad * 2 - content;
  const extra = Math.min(free / (slots.length + 1), size.tagW / 2);

  let left = size.pad + (free - extra * Math.max(0, slots.length - 1)) / 2;
  const items = slots.map((slot, i): LineItem => {
    const x = left + widthOf(slot) / 2;
    left += widthOf(slot) + size.gap + extra;
    return { slot, x, y: sagAt(x, width, size), tilt: TILTS[i % TILTS.length], color: COLORS[i % COLORS.length] };
  });
  return { items, width };
}

/** 上一件、下一件：按时间绳上的顺序 */
export function neighbors(works: readonly Work[], id: string): { prev?: Work; next?: Work } {
  const sorted = [...works].sort(byDate);
  const i = sorted.findIndex((w) => w.id === id);
  if (i < 0) return {};
  return { prev: sorted[i - 1], next: sorted[i + 1] };
}

/** 「2025年6月1日」 */
export function fullDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${y}年${m}月${d}日`;
}

/** 「6月1日」 */
export function monthDay(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}月${d}日`;
}

type When = Work["when"];

/** 作品页、预览上的日子：「2026年6月1日」，只记得大概的写「2026年10月前后」 */
export function whenLong(when: When): string {
  if (!when.approx) return fullDate(when.date);
  const [y, m] = when.date.split("-").map(Number);
  return `${y}年${m}月前后`;
}

/** 绳子上的日子：「6月1日」，只记得大概的写「10月」 */
export function whenShort(when: When): string {
  return when.approx ? `${Number(when.date.slice(5, 7))}月` : monthDay(when.date);
}

/** 离今天多久；只记得大概的不说几天，说「最近」「大约 2 个月前」 */
export function whenAgo(when: When, today: Date): string {
  const text = ago(when.date, today);
  if (!when.approx) return text;
  return text.includes("个月") || text.includes("年") ? `大约 ${text}` : "最近";
}

/** 离今天多久：「今天」「3 天前」「5 个月前」「1 年零 5 个月前」 */
export function ago(date: string, today: Date): string {
  const [y, m, d] = date.split("-").map(Number);
  const days = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, m - 1, d)) / 86400000);
  if (days < 0) return "还没到那天";
  if (days === 0) return "就是今天";
  if (days < 31) return `${days} 天前`;
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() - (m - 1));
  if (today.getDate() < d) months -= 1;
  months = Math.max(1, months);
  if (months < 12) return `${months} 个月前`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} 年零 ${rest} 个月前` : `${years} 年前`;
}
