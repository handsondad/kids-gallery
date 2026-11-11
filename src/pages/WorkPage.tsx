import { useEffect, useRef, type TouchEvent } from "react";
import type { Work } from "../work/types.ts";
import { KIND_NAMES, creditLine } from "../work/vocab.ts";
import { WORKS, photoUrl, storyUrl } from "../works/index.ts";
import { IntroBubble } from "./IntroBubble.tsx";
import { ago, fullDate, neighbors } from "./timeline.ts";

/** 手指横着划过这么远才算翻页，免得上下滚动时误翻 */
const SWIPE = 60;

export function WorkPage({ work }: { work: Work }) {
  const { prev, next } = neighbors(WORKS, work.id);
  const prevHref = prev ? `#/work/${prev.id}` : null;
  const nextHref = next ? `#/work/${next.id}` : null;
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" && prevHref) location.hash = prevHref;
      else if (e.key === "ArrowRight" && nextHref) location.hash = nextHref;
      else if (e.key === "Escape") location.hash = "#/";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref]);

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const to = dx < 0 ? nextHref : prevHref;
    if (to) location.hash = to;
  };

  return (
    <div className="app">
      <div className="topbar">
        <a className="btn ghost" href="#/">← 画廊</a>
        <h1>{work.title}</h1>
        <span className="meta">{creditLine(work.by)}</span>
      </div>

      <div className="viewer" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <figure className="frame" key={work.id}>
          <span className="tape left" aria-hidden="true" />
          <span className="tape right" aria-hidden="true" />
          <img src={photoUrl(work)} alt={work.alt} />
        </figure>

        <section className="plaque">
          <p className="when">
            {fullDate(work.when.date)}
            {work.when.label && <span className="chip">{work.when.label}</span>}
            <span className="ago">{ago(work.when.date, new Date())}</span>
          </p>
          <IntroBubble work={work} />
          <p>{work.about}</p>
          {work.said && <blockquote className="said">「{work.said}」<cite>—— 小念</cite></blockquote>}
          <p className="by">{KIND_NAMES[work.kind]} · {work.medium}</p>
          {work.story && (
            <a className="btn ghost" href={storyUrl(work.story)}>📚 那天的故事，在漫画书里</a>
          )}
        </section>

        <div className="pager">
          {prevHref ? <a className="btn ghost" href={prevHref}>上一件</a> : <button className="btn ghost" disabled>上一件</button>}
          {nextHref ? <a className="btn" href={nextHref}>下一件</a> : <a className="btn" href="#/">回画廊</a>}
        </div>
        <p className="hint">左右滑动或按 ← → 换一件，Esc 回画廊</p>
      </div>
    </div>
  );
}
