// Generates PNG favicons/app icons from public/brand-snake.svg into the app/ directory.
// Requires 'sharp' (already present in this Next.js project).
//
// Outputs:
// - app/icon.png (512x512, transparent bg)
// - app/apple-icon.png (180x180, white bg)
// - app/icon-192.png (192x192, transparent bg)
// - app/icon-512.png (512x512, transparent bg)
// - app/maskable-512.png (512x512, brand bg for PWA maskable)
//
// Run from project root or python-learning-app directory:
//   node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

(async () => {
  const projectRoot = process.cwd();
  const svgPath = path.resolve(projectRoot, "public", "brand-snake.svg");
  const outDir = path.resolve(projectRoot, "app");

  if (!fs.existsSync(svgPath)) {
    console.error("Missing public/brand-snake.svg. Aborting.");
    process.exit(1);
  }
  if (!fs.existsSync(outDir)) {
    console.error("Missing app/ directory. Aborting.");
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  async function makePNG({ size, filename, background }) {
    const out = path.join(outDir, filename);
    // Use 'contain' to keep safe padding; set background if provided (solid), else keep transparency.
    const img = sharp(svgBuffer).resize(size, size, {
      fit: "contain",
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    });
    await img.png().toFile(out);
    console.log("Wrote", path.relative(projectRoot, out));
  }

  // Transparent favicons
  await makePNG({ size: 512, filename: "icon.png" });
  await makePNG({ size: 192, filename: "icon-192.png" });
  await makePNG({ size: 512, filename: "icon-512.png" });

  // Apple touch icon prefers non-transparent background (white)
  await makePNG({ size: 180, filename: "apple-icon.png", background: { r: 255, g: 255, b: 255, alpha: 1 } });

  // Maskable icon for PWA with brand background (#a16207)
  await makePNG({ size: 512, filename: "maskable-512.png", background: { r: 161, g: 98, b: 7, alpha: 1 } });

  console.log("All icons generated successfully.");
})();