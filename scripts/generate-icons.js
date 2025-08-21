// Generates icons from an SVG source into both app/ and public/.
// Priority source: public/python.svg (if present), otherwise falls back to public/brand-snake.svg.
// Requires 'sharp' and 'png-to-ico'.
//
// Outputs (duplicated to app/ and public/):
// - icon.png (512x512, transparent bg)
// - apple-icon.png (180x180, white bg)
// - icon-192.png (192x192, transparent bg)
// - icon-512.png (512x512, transparent bg)
// - maskable-512.png (512x512, brand bg for PWA maskable)
// Additionally:
// - public/favicon.ico (ICO with 16/32/48 sizes)
//
// Run from project root or python-learning-app directory:
//   node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
// Support both CJS and ESM default export shapes for png-to-ico
const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule && pngToIcoModule.default ? pngToIcoModule.default : pngToIcoModule;

(async () => {
  const projectRoot = process.cwd();
  const outAppDir = path.resolve(projectRoot, "app");
  const outPublicDir = path.resolve(projectRoot, "public");
  const publicDir = outPublicDir;

  // Prefer public/python.svg if exists; else fallback to public/brand-snake.svg
  const svgCandidates = ["python.svg", "brand-snake.svg"];
  let svgPath = null;
  for (const name of svgCandidates) {
    const candidate = path.join(publicDir, name);
    if (fs.existsSync(candidate)) {
      svgPath = candidate;
      break;
    }
  }

  if (!svgPath) {
    console.error("Missing public/python.svg and public/brand-snake.svg. Aborting.");
    process.exit(1);
  }
  if (!fs.existsSync(outAppDir)) {
    console.error("Missing app/ directory. Aborting.");
    process.exit(1);
  }
  if (!fs.existsSync(outPublicDir)) {
    console.error("Missing public/ directory. Aborting.");
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  async function makePNG({ size, filename, background }) {
    const appOut = path.join(outAppDir, filename);
    const pubOut = path.join(outPublicDir, filename);
    // Use 'contain' to keep safe padding; set background if provided (solid), else keep transparency.
    const img = sharp(svgBuffer).resize(size, size, {
      fit: "contain",
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const pngBuffer = await img.png().toBuffer();

    // Always write to app/ (App Router metadata route sources)
    await fs.promises.writeFile(appOut, pngBuffer);
    console.log("Wrote", path.relative(projectRoot, appOut));
 
    // To avoid Next.js conflict, do NOT write public/icon.png or public/apple-icon.png when app routes exist.
    // Next.js serves /icon.png and /apple-icon.png from app/ as special metadata routes.
    if (!["icon.png", "apple-icon.png"].includes(filename)) {
      await fs.promises.writeFile(pubOut, pngBuffer);
      console.log("Wrote", path.relative(projectRoot, pubOut));
    } else {
      // If an old public/icon.png or public/apple-icon.png exists, remove it to prevent conflicts.
      try {
        await fs.promises.unlink(pubOut);
        console.log("Removed stale", path.relative(projectRoot, pubOut));
      } catch {}
    }
  }

  // Transparent favicons
  await makePNG({ size: 512, filename: "icon.png" });
  await makePNG({ size: 192, filename: "icon-192.png" });
  await makePNG({ size: 512, filename: "icon-512.png" });

  // Apple touch icon prefers non-transparent background (white)
  await makePNG({ size: 180, filename: "apple-icon.png", background: { r: 255, g: 255, b: 255, alpha: 1 } });

  // Maskable icon for PWA with brand background (#a16207)
  await makePNG({ size: 512, filename: "maskable-512.png", background: { r: 161, g: 98, b: 7, alpha: 1 } });

  // Generate favicon.ico in public/ using multiple PNG sizes
  async function makeICO() {
    const sizes = [16, 32, 48];
    const pngBuffers = [];
    for (const s of sizes) {
      const img = sharp(svgBuffer).resize(s, s, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      });
      pngBuffers.push(await img.png().toBuffer());
    }
    const icoBuffer = await pngToIco(pngBuffers);
    const icoPath = path.join(outPublicDir, "favicon.ico");
    await fs.promises.writeFile(icoPath, icoBuffer);
    console.log("Wrote", path.relative(projectRoot, icoPath));
  }
  await makeICO();

  console.log("All icons generated successfully from", path.relative(projectRoot, svgPath));
})();