// npm run voice 生成，别手改。key 是作品 id，对应 public/voice/<id>.mp3
export const VOICE_CLIPS: Readonly<Record<string, { readonly hash: string; readonly seconds: number }>> = {
  "clay-flower": { hash: "2f0e79f4", seconds: 12.1 },
  "opera-mask": { hash: "5b7ece30", seconds: 13.99 },
};
