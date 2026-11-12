import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Work } from "../work/types.ts";
import { KIND_NAMES, creditLine } from "../work/vocab.ts";
import { WORKS, photoUrl } from "../works/index.ts";
import { IntroBubble } from "./IntroBubble.tsx";
import {
  buildTree, byDate, COMPACT, findGroup, layoutLine, pathTo, pathToWork, sizeFor, toggleOpen, visibleSlots,
  whenAgo, whenLong, whenShort, type Group, type TreeSlot,
} from "./timeline.ts";
import { wallMemory } from "./wallMemory.ts";

/** 鼠标按住挪过这么多像素才算拖绳子，不算点 */
const DRAG = 5;

const TREE = buildTree(WORKS);
const LATEST = [...WORKS].sort(byDate).pop();

const slotKey = (s: TreeSlot) => (s.kind === "work" ? `w:${s.work.id}` : `g:${s.group.key}`);
const groupOfKey = (k: string | null) => (k?.startsWith("g:") ? findGroup(TREE, k.slice(2)) : undefined);
const workOfKey = (k: string | null) => (k?.startsWith("w:") ? WORKS.find((w) => w.id === k.slice(2)) : undefined);
/** 「2026年9月」「2026年」 */
const groupTitle = (g: Group) => (g.level === "month" ? `${g.key.slice(0, 4)}年${g.name}` : g.name);

export function WallPage() {
  const scroller = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    // 少给两个像素，免得小数取整后多出一截能滑的地方
    const ro = new ResizeObserver(() => setRoom(Math.max(0, el.clientWidth - 2)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const size = sizeFor(room);

  // 一进来展开到最近的那一件；看大图回来，绳子还是刚才展开、选中的样子
  const [rawOpen, setOpen] = useState<string[]>(() => wallMemory.open ?? (LATEST ? pathToWork(TREE, LATEST.id) : []));
  const open = useMemo(() => rawOpen.filter((k) => findGroup(TREE, k)), [rawOpen]);
  const { items, width } = useMemo(() => layoutLine(visibleSlots(TREE, open), room, size), [open, room, size]);
  const keys = items.map((it) => slotKey(it.slot));

  const [picked, setPicked] = useState<string | null>(() => wallMemory.picked ?? (LATEST ? `w:${LATEST.id}` : null));
  const [peek, setPeek] = useState<string | null>(null);
  const fallback = open.length ? `g:${open[open.length - 1]}` : keys[keys.length - 1];
  const chosen = picked && keys.includes(picked) ? picked : fallback ?? null;
  const shown = peek ?? chosen;
  const shownGroup = groupOfKey(shown);
  const shownWork = workOfKey(shown);

  useEffect(() => {
    wallMemory.open = open;
    wallMemory.picked = chosen ?? undefined;
  }, [open, chosen]);

  // 跟着刚打开的那一层走：上面几层的旗子放得下就一起露出来，看得出是从哪里一路点进来的
  const lastOpen = open[open.length - 1];
  const moved = useRef(false);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !room) return;
    const flags = items.filter((it) => it.slot.kind === "flag");
    const flag = flags[flags.length - 1];
    const before = size.flagW / 2 + size.gap;
    let left = !flag ? 0 : flag.x - flags[0].x < el.clientWidth * 0.45 ? flags[0].x - before : flag.x - before;
    // 选中的那一件也要整个露出来
    const sel = items.find((it) => slotKey(it.slot) === chosen);
    if (sel) left = Math.max(left, sel.x + size.tagW / 2 + size.gap - el.clientWidth);
    el.scrollTo({ left: Math.max(0, left), behavior: moved.current ? "smooth" : "auto" });
    moved.current = true;
  }, [lastOpen, width, room]);

  const toggle = (g: Group) => {
    setOpen(toggleOpen(open, g.key));
    setPicked(`g:${g.key}`);
  };
  const openTo = (g: Group) => {
    setOpen(pathTo(TREE, g.key));
    setPicked(`g:${g.key}`);
  };

  const [edges, setEdges] = useState({ left: false, right: false });
  const updateEdges = useCallback(() => {
    const el = scroller.current;
    if (el) setEdges({ left: el.scrollLeft > 4, right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4 });
  }, []);
  useEffect(updateEdges, [items, room, updateEdges]);

  // 没有滚动条：电脑上按住拖、或者滚轮，都能让绳子左右走；手机上手指直接滑
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let drag: { x: number; left: number; moved: boolean } | null = null;
    let draggedAt = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button === 0) drag = { x: e.clientX, left: el.scrollLeft, moved: false };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > DRAG) {
        drag.moved = true;
        el.classList.add("dragging");
      }
      if (drag.moved) el.scrollLeft = drag.left - dx;
    };
    const up = () => {
      if (drag?.moved) draggedAt = Date.now();
      drag = null;
      el.classList.remove("dragging");
    };
    // 拖完松手时浏览器会补一个点击，别让它打开、收起或者选中
    const click = (e: MouseEvent) => {
      if (Date.now() - draggedAt < 80) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      // 滚到头了就让页面接着上下滚
      if (max <= 0 || (e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("click", click, true);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("click", click, true);
      el.removeEventListener("wheel", wheel);
    };
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = keys[keys.indexOf(chosen ?? "") + (e.key === "ArrowLeft" ? -1 : 1)];
    if (!next) return;
    e.preventDefault();
    setPicked(next);
    document.getElementById(`slot-${next}`)?.focus();
  };

  const slotProps = (key: string) => ({
    id: `slot-${key}`,
    role: "option",
    "aria-selected": key === chosen,
    tabIndex: key === chosen ? 0 : -1,
    onMouseEnter: () => setPeek(key),
    onFocus: () => setPicked(key),
  });

  const rope = `M ${size.pad / 2},${size.top} Q ${width / 2},${size.top + size.sag * 2} ${width - size.pad / 2},${size.top}`;

  return (
    <div className="app">
      <header className="hero">
        <h1>小念的画廊</h1>
        <p>小念画的画、做的手工，按做出来的日子夹在绳子上</p>
      </header>

      <section className={`line${size === COMPACT ? " compact" : ""}${edges.left ? " more-left" : ""}${edges.right ? " more-right" : ""}`} aria-label="作品时间绳">
        <nav className="crumbs" aria-label="现在打开到哪儿">
          <button className={open.length ? "" : "here"} onClick={() => { setOpen([]); setPicked(null); }}>全部</button>
          {open.map((k, i) => {
            const g = findGroup(TREE, k);
            return g && (
              <Fragment key={k}>
                <span className="sep" aria-hidden="true">›</span>
                <button className={i === open.length - 1 ? "here" : ""} onClick={() => { setOpen(open.slice(0, i + 1)); setPicked(`g:${k}`); }}>
                  {g.name}
                </button>
              </Fragment>
            );
          })}
        </nav>

        <div className="line-scroll" ref={scroller} onScroll={updateEdges}>
          <div className="line-track" style={{ width, height: size.rowH }} onMouseLeave={() => setPeek(null)}>
            <svg className="rope" width={width} height={size.top + size.sag + 20} aria-hidden="true">
              <path d={rope} />
            </svg>
            <span className="pole" style={{ left: size.pad / 2 - 9, height: size.rowH - 24 }} aria-hidden="true" />
            <span className="pole" style={{ left: width - size.pad / 2 - 9, height: size.rowH - 24 }} aria-hidden="true" />
            <div role="listbox" aria-label="按日子挂的作品" aria-orientation="horizontal" onKeyDown={onKey}>
              {items.map(({ slot, x, y, tilt, color }) => {
                const key = slotKey(slot);
                const on = key === shown;
                const top = size.top + y;
                if (slot.kind === "flag") {
                  const g = slot.group;
                  return (
                    <button key={key} {...slotProps(key)} className={`banner ${g.level}${on ? " on" : ""}`} aria-expanded="true"
                      aria-label={`${groupTitle(g)}，${g.works.length} 件，点一下收起`}
                      style={{ left: x - size.flagW / 2, top: top - 4, width: size.flagW }} onClick={() => toggle(g)}>
                      <span className="banner-cloth">
                        <span className="banner-name">{g.name}</span>
                        <span className="banner-count">{g.works.length} 件</span>
                        <span className="banner-fold">‹ 收起</span>
                      </span>
                    </button>
                  );
                }
                if (slot.kind === "bundle") {
                  const g = slot.group;
                  return (
                    <button key={key} {...slotProps(key)} className={`tag bundle ${g.level}${on ? " on" : ""}`} aria-expanded="false"
                      aria-label={`${groupTitle(g)}，${g.works.length} 件作品，点开`}
                      style={{ left: x - size.bundleW / 2, top: top - 10, width: size.bundleW }} onClick={() => toggle(g)}>
                      <span className="peg" aria-hidden="true" />
                      <span className="card" style={{ background: color, ["--tilt" as string]: `${tilt}deg` }}>
                        <span className="bundle-name">{g.name}</span>
                        <span className="stack" aria-hidden="true">
                          {g.works.slice(-4).map((w) => <img key={w.id} className="mini" src={photoUrl(w)} alt="" loading="lazy" draggable={false} />)}
                        </span>
                        <span className="bundle-count">{g.works.length} 件 · 点开</span>
                      </span>
                    </button>
                  );
                }
                const w = slot.work;
                return (
                  <button key={key} {...slotProps(key)} className={on ? "tag on" : "tag"}
                    style={{ left: x - size.tagW / 2, top: top - 10, width: size.tagW }}
                    onClick={() => setPicked(key)} onDoubleClick={() => { location.hash = `#/work/${w.id}`; }}>
                    <span className="peg" aria-hidden="true" />
                    <span className="card" style={{ background: color, ["--tilt" as string]: `${tilt}deg` }}>
                      <img className="thumb" src={photoUrl(w)} alt="" loading="lazy" draggable={false} />
                      <span className="day">{whenShort(w.when)}</span>
                      <span className="name">{w.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <p className="line-hint">拖一拖绳子 · 点牌子打开，点旗子收起 · 双击看大图</p>
      </section>

      {shownGroup ? (
        <GroupPreview group={shownGroup} isOpen={open.includes(shownGroup.key)} onToggle={() => toggle(shownGroup)} onChild={openTo} />
      ) : shownWork ? <Preview work={shownWork} /> : null}

      <section className="series">
        <p>同一个小念，还有一套漫画书</p>
        <a className="btn ghost" href="https://handsondad.github.io/storyverse/">📚 小念家的漫画书</a>
      </section>
    </div>
  );
}

function GroupPreview({ group, isOpen, onToggle, onChild }: { group: Group; isOpen: boolean; onToggle: () => void; onChild: (g: Group) => void }) {
  const first = group.works[0];
  const last = group.works[group.works.length - 1];
  return (
    <article className="preview group-preview" key={group.key} aria-live="polite">
      <div className="mosaic" data-count={Math.min(group.works.length, 9)} aria-hidden="true">
        {group.works.slice(-9).map((w) => (
          <a key={w.id} href={`#/work/${w.id}`} tabIndex={-1}>
            <img className="mini" src={photoUrl(w)} alt="" />
          </a>
        ))}
      </div>
      <div className="preview-info">
        <p className="when">
          {whenShort(first.when)}{first !== last && ` — ${whenShort(last.when)}`}
        </p>
        <h2>{groupTitle(group)}</h2>
        <p>这{group.level === "year" ? "一年" : "个月"}小念做了 {group.works.length} 件作品：</p>
        <div className="kids">
          {group.children.map((c) => c.kind === "group" ? (
            <button key={c.key} type="button" className="kid more" onClick={() => onChild(c)}>
              {c.name} <b>{c.works.length}</b>
            </button>
          ) : (
            <a key={c.work.id} className="kid" href={`#/work/${c.work.id}`}>{c.work.title}</a>
          ))}
        </div>
        <button type="button" className="btn" onClick={onToggle}>{isOpen ? "在绳子上收起" : "在绳子上打开"}</button>
      </div>
    </article>
  );
}

function Preview({ work }: { work: Work }) {
  return (
    <article className="preview" key={work.id} aria-live="polite">
      <a className="preview-photo" href={`#/work/${work.id}`} aria-label={`看大图：${work.title}`}>
        <img src={photoUrl(work)} alt={work.alt} />
      </a>
      <div className="preview-info">
        <p className="when">
          {whenLong(work.when)}
          {work.when.label && <span className="chip">{work.when.label}</span>}
          <span className="ago">{whenAgo(work.when, new Date())}</span>
        </p>
        <h2>{work.title}</h2>
        <IntroBubble work={work} />
        <p>{work.about}</p>
        {work.said && <blockquote className="said">「{work.said}」</blockquote>}
        <p className="by">{creditLine(work.by)} · {KIND_NAMES[work.kind]} · {work.medium}</p>
        <a className="btn" href={`#/work/${work.id}`}>看大图</a>
      </div>
    </article>
  );
}
