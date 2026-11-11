import assert from "node:assert/strict";
import { test } from "node:test";
import { ago, layoutLine, LINE, neighbors, sagAt } from "../src/pages/timeline.ts";
import { WORKS } from "../src/works/index.ts";

const fake = (id, date) => ({ ...WORKS[0], id, when: { date } });

test("时间绳：按日子从早到晚排，跨年挂一面年份旗，挂件不重叠", () => {
  const { items, width } = layoutLine([fake("c", "2026-04-22"), fake("a", "2025-06-01"), fake("b", "2025-12-31")]);
  assert.deepEqual(items.map((it) => (it.kind === "year" ? it.year : it.work.id)), [2025, "a", "b", 2026, "c"]);
  for (let i = 1; i < items.length; i++) assert.ok(items[i].x > items[i - 1].x);
  assert.ok(items[0].x - LINE.yearW / 2 >= LINE.pad - 0.01);
  assert.ok(items.at(-1).x + LINE.tagW / 2 <= width - LINE.pad + 0.01);
});

test("框比挂件宽时绳子拉满，挂件左右对称", () => {
  const { items, width } = layoutLine([fake("a", "2025-06-01"), fake("b", "2026-04-22")], 1200);
  assert.equal(Math.round(width), 1200);
  const left = items[0].x - LINE.yearW / 2;
  const right = width - (items.at(-1).x + LINE.tagW / 2);
  assert.ok(Math.abs(left - right) < 0.01);
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

test("离今天多久", () => {
  const today = new Date(2026, 10, 9);
  assert.equal(ago("2026-11-09", today), "就是今天");
  assert.equal(ago("2026-11-02", today), "7 天前");
  assert.equal(ago("2026-04-22", today), "6 个月前");
  assert.equal(ago("2025-06-01", today), "1 年零 5 个月前");
  assert.equal(ago("2024-11-09", today), "2 年前");
  assert.equal(ago("2026-12-01", today), "还没到那天");
});
