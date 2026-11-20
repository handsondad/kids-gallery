// 把一张作品照片放进画廊：转正、缩到长边 1600、存成 JPEG，顺便去掉拍摄时间、GPS 这些信息；
// 同时出一张短边 360 的缩略图给首页的绳子用，宽高写进 src/work/photo-manifest.ts。
// 用法：
//   npm run photo -- <作品id> <照片路径>    换照片
//   npm run photo -- --thumbs [作品id...]   用已经处理好的照片重出缩略图和宽高表
//
// 用本机 Edge/Chrome 的画布重画一遍，所以不需要装图像库；手机的 HEIC 先导出成 JPG 再用。
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { findBrowser } from "./browser.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const PHOTO = {
  /** 长边最多多少像素 */
  maxSide: 2000,
  /** 处理时缩到的长边 */
  targetSide: 1600,
  /** 一张照片最多多大 */
  maxBytes: 800 * 1024,
  /** 缩略图的短边：绳子上的方块按 cover 裁，短边够大就不糊 */
  thumbSide: 360,
  /** 一张缩略图最多多大 */
  thumbMaxBytes: 80 * 1024,
};

export const THUMB = "thumb.jpg";
export const PHOTO_MANIFEST = join(root, "src/work/photo-manifest.ts");

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".bmp": "image/bmp" };

/** JPEG / PNG 的尺寸和带没带拍摄信息；认不出来返回 null */
export function inspectPhoto(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    let meta = false;
    let size = null;
    while (i + 4 <= buf.length && buf[i] === 0xff) {
      const marker = buf[i + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const len = buf.readUInt16BE(i + 2);
      // APP1 放 Exif / XMP，APP13 放 IPTC：拍摄时间、GPS、相机型号都在这里
      if (marker === 0xe1 || marker === 0xed) meta = true;
      // SOF0～SOF15（除了 DHT、JPG、DAC）里有宽高
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        size = { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return size && { type: "jpeg", ...size, meta };
  }
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    let i = 8;
    let meta = false;
    let size = null;
    while (i + 8 <= buf.length) {
      const len = buf.readUInt32BE(i);
      const type = buf.toString("latin1", i + 4, i + 8);
      if (type === "IHDR") size = { width: buf.readUInt32BE(i + 8), height: buf.readUInt32BE(i + 12) };
      if (["eXIf", "tEXt", "iTXt", "zTXt"].includes(type)) meta = true;
      if (type === "IEND") break;
      i += 12 + len;
    }
    return size && { type: "png", ...size, meta };
  }
  return null;
}

/** 返回问题列表，空数组表示这张照片能直接发布 */
export function photoIssues(buf) {
  const info = inspectPhoto(buf);
  if (!info) return ["认不出来，只收 JPEG 或 PNG"];
  const problems = [];
  if (info.meta) problems.push("带着拍摄信息（时间、GPS、相机），跑 npm run photo 重新处理");
  if (Math.max(info.width, info.height) > PHOTO.maxSide) problems.push(`${info.width}×${info.height} 太大，长边不超过 ${PHOTO.maxSide}，跑 npm run photo`);
  if (buf.length > PHOTO.maxBytes) problems.push(`${(buf.length / 1024).toFixed(0)} KB 太大，不超过 ${PHOTO.maxBytes / 1024} KB，跑 npm run photo`);
  return problems;
}

/** 照片能不能处理：格式不认识或找不到就抛错，返回 MIME 类型 */
export function sourceMime(source) {
  const mime = MIME[extname(source).toLowerCase()];
  if (!mime) throw new Error(`不认识 ${extname(source) || "这种"}文件；手机照片先导出成 JPG`);
  if (!existsSync(source)) throw new Error(`找不到照片：${source}`);
  return mime;
}

/**
 * 用浏览器的画布把一张图重画成几份 JPEG。jobs 里每份写 long（长边缩到多少）或 short（短边缩到多少），
 * 只缩不放；返回同样顺序的 Buffer
 */
async function render(source, jobs) {
  const mime = sourceMime(source);
  const input = `data:${mime};base64,${readFileSync(source).toString("base64")}`;

  const { default: puppeteer } = await import("puppeteer-core");
  const browser = await puppeteer.launch({ executablePath: findBrowser(), headless: true });
  try {
    const page = await browser.newPage();
    const urls = await page.evaluate(async (src, jobs) => {
      const blob = await (await fetch(src)).blob();
      const bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return jobs.map(({ long, short, quality }) => {
        const scale = Math.min(1, long ? long / Math.max(bmp.width, bmp.height) : short / Math.min(bmp.width, bmp.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        const ctx = canvas.getContext("2d");
        // 透明的 PNG 垫白底，不然存成 JPEG 是黑底
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", quality);
      });
    }, input, jobs);
    return urls.map((url) => Buffer.from(url.split(",")[1], "base64"));
  } finally {
    await browser.close();
  }
}

const THUMB_JOB = { short: PHOTO.thumbSide, quality: 0.8 };

/** 处理一张照片，写到 public/works/<id>/photo.jpg 和缩略图，更新宽高表，返回照片的文件路径 */
export async function processPhoto(id, source) {
  const [photo, thumb] = await render(source, [{ long: PHOTO.targetSide, quality: 0.85 }, THUMB_JOB]);
  const dir = join(root, "public/works", id);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "photo.jpg");
  writeFileSync(file, photo);
  writeFileSync(join(dir, THUMB), thumb);
  writePhotoManifest();
  return file;
}

/** 用已经处理好的 photo.jpg 重出缩略图（照片本身不动，免得再压一遍变糊） */
export async function makeThumb(id) {
  const dir = join(root, "public/works", id);
  const [thumb] = await render(join(dir, "photo.jpg"), [THUMB_JOB]);
  writeFileSync(join(dir, THUMB), thumb);
}

/** 扫一遍 public/works/<id>/photo.jpg，把宽高写进 src/work/photo-manifest.ts，作品页先按比例占好位置 */
export function writePhotoManifest() {
  const dir = join(root, "public/works");
  const ids = existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort() : [];
  const rows = ids.flatMap((id) => {
    const file = join(dir, id, "photo.jpg");
    const info = existsSync(file) && inspectPhoto(readFileSync(file));
    return info ? [`  ${JSON.stringify(id)}: { width: ${info.width}, height: ${info.height} },`] : [];
  });
  writeFileSync(PHOTO_MANIFEST, [
    "// npm run photo 生成，别手改。key 是作品 id，对应 public/works/<id>/photo.jpg 的宽高",
    `export const PHOTO_SIZES: Readonly<Record<string, { readonly width: number; readonly height: number }>> = {${rows.length ? `\n${rows.join("\n")}\n` : ""}};`,
    "",
  ].join("\n"));
}

const report = (id, name) => {
  const buf = readFileSync(join(root, "public/works", id, name));
  const info = inspectPhoto(buf);
  console.log(`public/works/${id}/${name}（${info.width}×${info.height}，${(buf.length / 1024).toFixed(0)} KB）`);
  return buf;
};

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--thumbs") {
    const dir = join(root, "public/works");
    const ids = args.length > 1 ? args.slice(1) : readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
    for (const id of ids) {
      if (!existsSync(join(dir, id, "photo.jpg"))) throw new Error(`找不到 public/works/${id}/photo.jpg`);
      await makeThumb(id);
      report(id, THUMB);
    }
    writePhotoManifest();
    return;
  }
  const [id, source] = args;
  if (!id || !source) {
    console.error("用法：npm run photo -- <作品id> <照片路径>，或者 npm run photo -- --thumbs [作品id...]");
    process.exit(1);
  }
  await processPhoto(id, resolve(source));
  const problems = photoIssues(report(id, "photo.jpg"));
  report(id, THUMB);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
}

const entry = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href;
if (entry === import.meta.url) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
