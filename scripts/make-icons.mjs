// Generates the PWA icons in public/icons from the leaf mark in components/Logo.tsx.
// Run with: node scripts/make-icons.mjs
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(import.meta.dirname, "..", "public", "icons");
const BG = "#e5f4ee"; // --color-brand-soft

// Same paths as <Leaf />, drawn in a 32×32 box.
const LEAF = `
  <path d="M16 28V17" stroke="#0e6b52" stroke-width="2.4" stroke-linecap="round" fill="none" />
  <path d="M16 18C8 18 5 12 5 6c7 0 11 4 11 12Z" fill="#3fae49" />
  <path d="M16 16c0-7 4-11 11-11 0 6-3 11-11 11Z" fill="#0e6b52" />`;

/**
 * `leafScale` is the leaf box as a share of the icon. Maskable icons get a
 * full-bleed square and a smaller mark so it stays inside the 80% safe zone.
 */
function svg(size, { maskable }) {
  const leafScale = maskable ? 0.5 : 0.62;
  const box = size * leafScale;
  const offset = (size - box) / 2;
  const radius = maskable ? 0 : size * 0.22;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${BG}" />
  <g transform="translate(${offset} ${offset}) scale(${box / 32})">${LEAF}</g>
</svg>`;
}

const icons = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];

mkdirSync(OUT, { recursive: true });
for (const { file, size, maskable } of icons) {
  await sharp(Buffer.from(svg(size, { maskable }))).png().toFile(path.join(OUT, file));
  console.log("wrote", file);
}
