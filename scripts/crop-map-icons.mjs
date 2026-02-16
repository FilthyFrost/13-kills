/**
 * 从 8-bit 图标源图裁剪地图节点图标，黑色背景转透明
 */
import sharp from 'sharp';
import { mkdir, copyFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = '/Users/haobinlu/.cursor/projects/Users-haobinlu-Desktop-13/assets/image-b4f299a5-faaf-4803-86a2-21cf6d1260db.png';
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'map');

// 512x512 图像，8行12列，每格 43x64
const CELL_W = Math.floor(512 / 12);
const CELL_H = 64;

// (row, col) 0-based，按源图描述选取
const ICONS = {
  icon_spawn: [0, 7],      // 游戏手柄
  icon_boss: [3, 6],      // 剑
  icon_merchant: [2, 4],  // 钱袋
  icon_treasure: [2, 6],  // 钻石
  icon_unknown: [6, 1],   // 放大镜
  icon_lock: [7, 7],      // 挂锁
};

async function cropAndMakeTransparent(name, row, col) {
  const left = col * CELL_W;
  const top = row * CELL_H;
  const { data } = await sharp(SRC)
    .extract({ left, top, width: CELL_W, height: CELL_H })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 黑色 (r,g,b < 40) -> 透明
  const buf = Buffer.from(data);
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i];
    const g = buf[i + 1];
    const b = buf[i + 2];
    if (r < 40 && g < 40 && b < 40) {
      buf[i + 3] = 0;
    }
  }

  const outPath = join(OUT_DIR, `${name}.png`);
  await sharp(buf, {
    raw: { width: CELL_W, height: CELL_H, channels: 4 },
  })
    .resize(64, 64, { kernel: 'nearest' })
    .png()
    .toFile(outPath);
  console.log(`Created ${name}.png`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await copyFile(SRC, join(OUT_DIR, 'icons_source.png'));
  console.log('Copied icons_source.png');

  for (const [name, [row, col]] of Object.entries(ICONS)) {
    await cropAndMakeTransparent(name, row, col);
  }
}

main().catch(console.error);
