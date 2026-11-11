import { useEffect, useRef, useState } from "react";
import type { Work } from "../work/types.ts";
import { VOICE_CLIPS } from "../work/voice-manifest.ts";
import { introHash, voiceUrl } from "../work/voice.ts";

/** 小念的口吻讲这件作品；配过音（而且字没改过）才有播放按钮 */
export function IntroBubble({ work }: { work: Work }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const voiced = !!work.intro && VOICE_CLIPS[work.id]?.hash === introHash(work.intro);

  // 换了一件作品、离开页面，就停下
  useEffect(() => {
    setPlaying(false);
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, [work.id]);

  if (!work.intro) return null;

  const toggle = () => {
    if (playing) {
      audio.current?.pause();
      setPlaying(false);
      return;
    }
    const a = audio.current ?? new Audio(voiceUrl(work));
    audio.current = a;
    a.currentTime = 0;
    a.onended = () => setPlaying(false);
    a.onerror = () => setPlaying(false);
    a.play().then(() => setPlaying(true), () => setPlaying(false));
  };

  return (
    <div className={playing ? "intro playing" : "intro"}>
      <p className="intro-text"><span className="intro-who">小念讲：</span>{work.intro}</p>
      {voiced && (
        <button className={playing ? "btn ghost" : "btn play"} onClick={toggle} aria-pressed={playing}>
          {playing ? "⏸ 先停一下" : "▶ 听小念讲"}
        </button>
      )}
    </div>
  );
}
