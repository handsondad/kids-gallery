import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ago, buildTree, COMPACT, layoutLine, LINE, neighbors, pathToWork, sagAt, sizeFor, toggleOpen, visibleSlots,
  whenAgo, whenLong, whenShort,
} from "../src/pages/timeline.ts";
import { WORKS } from "../src/works/index.ts";

const fake = (id, date) => ({ ...WORKS[0], id, when: { date } });
// 2025 年：6 月一件、12 月两件；2026 年只有 4 月，两件
const SOME = [
  fake("e", "2026-04-25"), fake("a", "2025-06-01"), fake("c", "2025-12-31"), fake("b", "2025-12-02"), fake("d", "2026-04-22"),
];
const TREE = buildTree(SOME);
const names = (slots) => slots.map((s) => (s.kind === "work" ? s.work.id : `${s.kind}:${s.group.key}`));

test("全收着：每年一张牌子，从早到晚", () => {
  assert.deepEqual(names(visibleSlots(TREE, [])), ["bundle:2025", "bundle:2026"]);
  assert.deepEqual(TREE[0].works.map((w) => w.id), ["a", "b", "c"]);
});

test("点开一年：只有一件的月份直接挂作品，几件的收成月份牌", () => {
  assert.deepEqual(names(visibleSlots(TREE, ["2025"])), ["flag:2025", "a", "bundle:2025-12", "bundle:2026"]);
  assert.deepEqual(names(visibleSlots(TREE, ["2025", "2025-12"])), ["flag:2025", "a", "flag:2025-12", "b", "c", "bundle:2026"]);
  assert.equal(TREE[0].children[1].name, "12月");
});

test("一年只有一个月：跳过月这一层，点开年就是作品", () => {
  assert.deepEqual(names(visibleSlots(TREE, ["2026"])), ["bundle:2025", "flag:2026", "d", "e"]);
});

test("同一层只开一个；收起一年，里面的月份一起收", () => {
  assert.deepEqual(toggleOpen(["2025", "2025-12"], "2026"), ["2026"]);
  assert.deepEqual(toggleOpen(["2025"], "2025-12"), ["2025", "2025-12"]);
  assert.deepEqual(toggleOpen(["2025", "2025-12"], "2025"), []);
  assert.deepEqual(pathToWork(TREE, "c"), ["2025", "2025-12"]);
  assert.deepEqual(pathToWork(TREE, "e"), ["2026"]);
});

test("挂件不重叠；框比挂件宽时绳子拉满，整串居中", () => {
  const slots = visibleSlots(TREE, ["2025", "2025-12"]);
  const w = (s) => (s.kind === "bundle" ? LINE.bundleW : s.kind === "flag" ? LINE.flagW : LINE.tagW);
  const { items, width } = layoutLine(slots);
  for (let i = 1; i < items.length; i++) assert.ok(items[i].x - w(items[i].slot) / 2 >= items[i - 1].x + w(items[i - 1].slot) / 2);
  assert.ok(items[0].x - w(items[0].slot) / 2 >= LINE.pad - 0.01);
  assert.ok(items.at(-1).x + w(items.at(-1).slot) / 2 <= width - LINE.pad + 0.01);

  const wide = layoutLine(visibleSlots(TREE, []), 1200);
  assert.equal(Math.round(wide.width), 1200);
  const left = wide.items[0].x - LINE.bundleW / 2;
  const right = wide.width - (wide.items.at(-1).x + LINE.bundleW / 2);
  assert.ok(Math.abs(left - right) < 0.01);
});

test("画廊里每一件都挂得出来：展开到它，它就在绳子上", () => {
  const tree = buildTree(WORKS);
  for (const work of WORKS) {
    const slots = visibleSlots(tree, pathToWork(tree, work.id));
    assert.ok(slots.some((s) => s.kind === "work" && s.work.id === work.id), work.id);
  }
});

test("手机宽度用小一号的挂件", () => {
  assert.equal(sizeFor(390), COMPACT);
  assert.equal(sizeFor(1100), LINE);
  assert.equal(sizeFor(0), LINE);
});

test("绳子两头高、中间最低", () => {
  const w = 1000;
  assert.equal(sagAt(LINE.pad / 2, w), 0);
  assert.ok(Math.abs(sagAt(w / 2, w) - LINE.sag) < 0.01);
  assert.ok(sagAt(w * 0.25, w) < sagAt(w / 2, w));
});

test("上一件、下一件按日子排，两头没有", () => {
  const works = [fake("c", "2026-04-22"), fake("a", "2025-06-01"), fake("b", "2025-12-31")];
  assert.equal(neighbors(works, "b").prev?.id, "a");
  assert.equal(neighbors(works, "b").next?.id, "c");
  assert.equal(neighbors(works, "a").prev, undefined);
  assert.equal(neighbors(works, "c").next, undefined);
});

test("只记得大概的日子：只写到月，不说几天前", () => {
  const today = new Date(2026, 10, 11);
  assert.equal(whenLong({ date: "2026-06-01" }), "2026年6月1日");
  assert.equal(whenLong({ date: "2026-10-05", approx: true }), "2026年10月前后");
  assert.equal(whenShort({ date: "2026-06-01" }), "6月1日");
  assert.equal(whenShort({ date: "2026-10-05", approx: true }), "10月");
  assert.equal(whenAgo({ date: "2026-11-04", approx: true }, today), "最近");
  assert.equal(whenAgo({ date: "2026-09-17", approx: true }, today), "大约 1 个月前");
  assert.equal(whenAgo({ date: "2026-11-04" }, today), "7 天前");
});

test("离今天多久", () => {
  const today = new Date(2026, 10, 9);
  assert.equal(ago("2026-11-09", today), "就是今天");
  assert.equal(ago("2026-11-02", today), "7 天前");
  assert.equal(ago("2026-04-22", today), "6 个月前");
  assert.equal(ago("2025-06-01", today), "1 年零 5 个月前");
  assert.equal(ago("2024-11-09", today), "2 年前");
  assert.equal(ago("2026-12-01", today), "还没到那天");
});
