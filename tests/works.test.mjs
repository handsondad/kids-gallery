import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { WORKS } from "../src/works/index.ts";
import { creditLine } from "../src/work/vocab.ts";
import { introHash } from "../src/work/voice.ts";
import { CHARS_FILE, collect } from "../tools/font/subset.mjs";
import { checkWork } from "./gallery-rules.mjs";

test("字体子集包含页面上用到的每个字（缺了跑 npm run font）", () => {
  const have = new Set(readFileSync(CHARS_FILE, "utf8"));
  const missing = [...collect()].filter((ch) => !have.has(ch));
  assert.equal(missing.join(""), "");
});

test("画廊里每件作品都通过内容检查", () => {
  assert.ok(WORKS.length >= 1);
  for (const work of WORKS) {
    const problems = checkWork(work);
    assert.deepEqual(problems, [], problems.join("\n"));
  }
});

test("作品 id 互不重复", () => {
  const ids = WORKS.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("检查器拦得住：没有小念、外人署名、字太多", () => {
  const bad = { ...WORKS[0], by: ["dad", "grandma"], title: "一个特别特别特别长的作品名字" };
  const problems = checkWork(bad).join("\n");
  assert.match(problems, /要有小念/);
  assert.match(problems, /grandma/);
  assert.match(problems, /title：超过/);
});

test("配音指纹：改一个字、换一个声音就过期", () => {
  const text = "这是我在幼儿园做的花。";
  assert.equal(introHash(text), introHash(text));
  assert.notEqual(introHash(text), introHash("这是我在幼儿园做的画。"));
  assert.notEqual(introHash(text), introHash(text, { voice: "zh-CN-YunxiNeural", rate: "+0%" }));
});

test("署名：一个人、两个人、三个人", () => {
  assert.equal(creditLine(["nian"]), "小念做的");
  assert.equal(creditLine(["mom", "nian"]), "小念和妈妈一起做的");
  assert.equal(creditLine(["nian", "dad", "mom"]), "小念、爸爸和妈妈一起做的");
});
