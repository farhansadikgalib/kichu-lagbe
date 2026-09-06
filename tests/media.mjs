/**
 * Media pipeline test: uploads real images as admin and verifies each stored
 * asset is served as WebP at exactly its display size.
 *
 *   node tests/media.mjs [baseUrl]
 *
 * Fixtures are generated in-memory with sharp (also used to decode results),
 * so the test needs no image files on disk.
 */
import sharp from "sharp";

const BASE = process.argv[2] ?? "http://localhost:3000";
let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  ok ? passed++ : failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${name}${!ok && detail ? ` — ${detail}` : ""}`);
};

const png = (w, h, bg) => sharp({ create: { width: w, height: h, channels: 3, background: bg } }).png().toBuffer();
const jpg = (w, h, bg) => sharp({ create: { width: w, height: h, channels: 3, background: bg } }).jpeg().toBuffer();

let cookie = "";
{
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@kichulagbe.com", password: "Password123!" }),
  });
  cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  check("admin login", res.status === 200);
}

async function upload(bytes, type, name, fit, headers = { cookie }) {
  const form = new FormData();
  form.append("file", new Blob([bytes], { type }), name);
  if (fit) form.append("fit", fit);
  const res = await fetch(`${BASE}/api/admin/media`, { method: "POST", headers, body: form });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function served(url) {
  const res = await fetch(BASE + url);
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, type: res.headers.get("content-type"), bytes: buf.length, meta: await sharp(buf).metadata() };
}

const wide = await png(1200, 600, "#e63946");
const small = await jpg(300, 500, "#457b9d");

console.log("\n== square (default fit) from a wide 1200×600 PNG ==");
{
  const r = await upload(wide, "image/png", "photo.png");
  check("upload 201", r.status === 201, `status=${r.status} ${JSON.stringify(r.json)}`);
  check("asset mimeType is image/webp", r.json?.data?.mimeType === "image/webp");
  check("filename renamed to .webp", /\.webp$/.test(r.json?.data?.filename ?? ""), r.json?.data?.filename);
  const s = await served(r.json.data.url);
  check("served as image/webp", s.status === 200 && s.type === "image/webp", `${s.status} ${s.type}`);
  check("decoded format is webp", s.meta.format === "webp", s.meta.format);
  check("cover-cropped to 800×800", s.meta.width === 800 && s.meta.height === 800, `${s.meta.width}×${s.meta.height}`);
  check("reported size matches served bytes", r.json.data.size === s.bytes, `${r.json.data.size} vs ${s.bytes}`);
}

console.log("\n== wide fit (section art) from the same PNG ==");
{
  const r = await upload(wide, "image/png", "banner.png", "wide");
  check("upload 201", r.status === 201, `status=${r.status}`);
  const s = await served(r.json.data.url);
  check("webp at 1600×900", s.meta.format === "webp" && s.meta.width === 1600 && s.meta.height === 900, `${s.meta.format} ${s.meta.width}×${s.meta.height}`);
}

console.log("\n== small 300×500 JPEG is normalised to the display size ==");
{
  const r = await upload(small, "image/jpeg", "tiny.jpg", "square");
  check("upload 201", r.status === 201, `status=${r.status}`);
  const s = await served(r.json.data.url);
  check("webp at exactly 800×800", s.meta.format === "webp" && s.meta.width === 800 && s.meta.height === 800, `${s.meta.format} ${s.meta.width}×${s.meta.height}`);
}

console.log("\n== rejections ==");
{
  let r = await upload(wide, "image/png", "x.png", "huge");
  check("unknown fit rejected (422)", r.status === 422, `status=${r.status}`);
  r = await upload(Buffer.from("not an image"), "image/png", "fake.png");
  check("corrupt image rejected (422)", r.status === 422, `status=${r.status}`);
  r = await upload(Buffer.from("hello"), "text/plain", "x.txt");
  check("non-image type rejected (415)", r.status === 415, `status=${r.status}`);
  r = await upload(wide, "image/png", "x.png", undefined, {});
  check("anonymous upload rejected (401)", r.status === 401, `status=${r.status}`);
}

console.log(`\nPASSED: ${passed}  FAILED: ${failed}`);
process.exit(failed ? 1 : 0);
