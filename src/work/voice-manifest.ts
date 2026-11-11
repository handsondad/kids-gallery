// npm run voice 生成，别手改。key 是作品 id，对应 public/voice/<id>.mp3
export const VOICE_CLIPS: Readonly<Record<string, { readonly hash: string; readonly seconds: number }>> = {
  "cat-fan": { hash: "4a7db5aa", seconds: 10.15 },
  "clay-flower": { hash: "2f0e79f4", seconds: 12.1 },
  "clay-turtle": { hash: "f430050c", seconds: 7.22 },
  "dot-chick": { hash: "5d5b1661", seconds: 7.01 },
  "foam-wreath": { hash: "311ba877", seconds: 10.15 },
  "googly-monsters": { hash: "1151806e", seconds: 9.72 },
  "leaf-lion": { hash: "39d873c2", seconds: 8.06 },
  "mid-autumn-bunny": { hash: "378f1fa1", seconds: 10.06 },
  "mooncake-bunny-bag": { hash: "deee6ee6", seconds: 9.6 },
  "opera-mask": { hash: "5b7ece30", seconds: 13.99 },
  "paper-butterfly": { hash: "2e9b4b48", seconds: 10.42 },
  "paper-hedgehog": { hash: "d2621751", seconds: 9.98 },
  "paper-lollipop": { hash: "19c20c7d", seconds: 10.01 },
  "pink-butterfly": { hash: "c858b5b1", seconds: 8.28 },
};
