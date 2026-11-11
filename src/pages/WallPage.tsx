import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { KIND_NAMES, creditLine } from "../work/vocab.ts";
import { WORKS, photoUrl } from "../works/index.ts";
import { IntroBubble } from "./IntroBubble.tsx";
import { ago, fullDate, layoutLine, LINE, monthDay } from "./timeline.ts";

export function WallPage() {
  const scroller = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // 少给两个像素，免得小数取整后多出一条滚动条
    const ro = new ResizeObserver(() => setRoom(Math.max(0, el.clientWidth - 2)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { items, width } = useMemo(() => layoutLine(WORKS, room), [room]);
  const tags = items.filter((it) => it.kind === "work");
  const latest = tags[tags.length - 1]?.work.id;
  const [picked, setPicked] = useState(latest);
  const [peek, setPeek] = useState<string | null>(null);
  const shown = tags.find((t) => t.work.id === (peek ?? picked))?.work;

  // 绳子比屏幕长时，先让人看到最近的作品
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [width]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const i = tags.findIndex((t) => t.work.id === picked);
    const next = tags[i + (e.key === "ArrowLeft" ? -1 : 1)];
    if (!next) return;
    e.preventDefault();
    setPicked(next.work.id);
    document.getElementById(`tag-${next.work.id}`)?.focus();
  };

  const rope = `M ${LINE.pad / 2},${LINE.top} Q ${width / 2},${LINE.top + LINE.sag * 2} ${width - LINE.pad / 2},${LINE.top}`;

  return (
    <div className="app">
      <header className="hero">
        <h1>小念的画廊</h1>
        <p>小念画的画、做的手工，按做出来的日子夹在绳子上</p>
      </header>

      <section className="line" aria-label="作品时间绳">
        <div className="line-scroll" ref={scroller}>
          <div className="line-track" style={{ width }} onMouseLeave={() => setPeek(null)}>
            <svg className="rope" width={width} height={LINE.top + LINE.sag + 20} aria-hidden="true">
              <path d={rope} />
            </svg>
            <span className="pole" style={{ left: LINE.pad / 2 - 9 }} aria-hidden="true" />
            <span className="pole" style={{ left: width - LINE.pad / 2 - 9 }} aria-hidden="true" />
            <div role="listbox" aria-label="按时间排的作品" aria-orientation="horizontal" onKeyDown={onKey}>
              {items.map((it) => it.kind === "year" ? (
                <span key={`y${it.year}`} className="year-flag" style={{ left: it.x - LINE.yearW / 2, top: LINE.top + it.y - 4, width: LINE.yearW }} aria-hidden="true">
                  {it.year}
                </span>
              ) : (
                <button key={it.work.id} id={`tag-${it.work.id}`} role="option" aria-selected={it.work.id === picked}
                  tabIndex={it.work.id === picked ? 0 : -1}
                  className={it.work.id === (peek ?? picked) ? "tag on" : "tag"}
                  style={{ left: it.x - LINE.tagW / 2, top: LINE.top + it.y - 10, width: LINE.tagW }}
                  onMouseEnter={() => setPeek(it.work.id)} onFocus={() => setPicked(it.work.id)} onClick={() => setPicked(it.work.id)}>
                  <span className="peg" aria-hidden="true" />
                  <span className="card" style={{ background: it.color, ["--tilt" as string]: `${it.tilt}deg` }}>
                    <img className="thumb" src={photoUrl(it.work)} alt="" loading="lazy" />
                    <span className="day">{monthDay(it.work.when.date)}</span>
                    <span className="name">{it.work.title}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="line-hint">← 更早 · 指一指或点一点绳子上的作品 · 最近 →</p>
      </section>

      {shown && (
        <article className="preview" key={shown.id} aria-live="polite">
          <a className="preview-photo" href={`#/work/${shown.id}`} aria-label={`看大图：${shown.title}`}>
            <img src={photoUrl(shown)} alt={shown.alt} />
          </a>
          <div className="preview-info">
            <p className="when">
              {fullDate(shown.when.date)}
              {shown.when.label && <span className="chip">{shown.when.label}</span>}
              <span className="ago">{ago(shown.when.date, new Date())}</span>
            </p>
            <h2>{shown.title}</h2>
            <IntroBubble work={shown} />
            <p>{shown.about}</p>
            {shown.said && <blockquote className="said">「{shown.said}」</blockquote>}
            <p className="by">{creditLine(shown.by)} · {KIND_NAMES[shown.kind]} · {shown.medium}</p>
            <a className="btn" href={`#/work/${shown.id}`}>看大图</a>
          </div>
        </article>
      )}

      <section className="series">
        <p>同一个小念，还有一套漫画书</p>
        <a className="btn ghost" href="https://handsondad.github.io/storyverse/">📚 小念家的漫画书</a>
      </section>
    </div>
  );
}
