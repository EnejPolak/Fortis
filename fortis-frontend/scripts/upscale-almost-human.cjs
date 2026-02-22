/**
 * Upscales all images in public/Alomst Human/ by 2x.
 * Uses sharp with Lanczos3 for high-quality, clean results.
 *
 * Usage: npm run upscale
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const IMG_DIR = path.join(__dirname, "../public/Alomst Human");
const SCALE = 2;
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

async function main() {
  const files = fs.readdirSync(IMG_DIR).filter((f) =>
    EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext))
  );

  if (files.length === 0) {
    console.log("No images found in", IMG_DIR);
    return;
  }

  console.log(`Upscaling ${files.length} image(s) by ${SCALE}x in Almost Human...`);

  for (const file of files) {
    const filePath = path.join(IMG_DIR, file);
    const ext = path.extname(file).toLowerCase();
    const tmpPath = path.join(IMG_DIR, `.tmp_${file}`);

    try {
      console.log(`  → ${file}`);
      const meta = await sharp(filePath).metadata();
      const w = meta.width || 0;
      const h = meta.height || 0;

      if (!w || !h) throw new Error("Could not read dimensions");

      const pipeline = sharp(filePath).resize(
        Math.round(w * SCALE),
        Math.round(h * SCALE),
        { kernel: sharp.kernel.lanczos3, fit: "fill" }
      );
      if (ext === ".png") {
        await pipeline.png().toFile(tmpPath);
      } else {
        await pipeline.jpeg({ quality: 95 }).toFile(tmpPath);
      }

      fs.renameSync(tmpPath, filePath);
      console.log(`    ✓ Done`);
    } catch (err) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      console.error(`    ✗ Failed:`, err.message);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
