/**
 * 「听小念讲」：作品页的播放按钮和配音工具（npm run voice）共用这里，指纹两边一定对得上。
 * 声音和《小念家的漫画书》里的小念是同一个。
 */
import type { Work } from "./types.ts";

export type Voice = { readonly voice: string; readonly rate: string; readonly pitch?: string };

export const NIAN_VOICE: Voice = { voice: "zh-CN-YunxiaNeural", rate: "+0%" };

/** 音频放在 public/voice/<作品id>.mp3 */
export const voiceUrl = (work: Work) => `voice/${work.id}.mp3`;

/** 同一个声音念同一段话，指纹就不变；改了字或换了声音，旧音频就过期。FNV-1a，浏览器和 Node 算出来一样 */
export function introHash(text: string, voice: Voice = NIAN_VOICE): string {
  const pitch = voice.pitch ? `|${voice.pitch}` : "";
  const s = `${voice.voice}|${voice.rate}${pitch}|${text}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
