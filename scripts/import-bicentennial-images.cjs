const fs = require('fs');
const path = require('path');
let sharp;
try { sharp = require('sharp'); }
catch (_) { sharp = require('\\\\wsl.localhost\\Ubuntu-22.04\\home\\victor\\node_modules\\sharp'); }

const sourceRoot = process.argv[2];
if (!sourceRoot || !fs.existsSync(sourceRoot)) {
  throw new Error('Usage: node scripts/import-bicentennial-images.cjs <source-directory>');
}

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(projectRoot, 'assets', 'coins');
const expectedOutputDir = path.join(projectRoot, 'assets', 'coins');
if (path.resolve(outputDir) !== path.resolve(expectedOutputDir)) throw new Error('Unexpected output directory');

const images = [
  ['1975-1976 bicentennial quarter obverse.webp', 'bicentennial-quarter-obverse-1976-official.webp'],
  ['1976-bicentennial-quarter-reverse.webp', 'bicentennial-quarter-reverse-1976-official.webp'],
  ['1975-1975 kennedy half dollar obverse.webp', 'bicentennial-half-dollar-obverse-1976-official.webp'],
  ['1976-bicentennial-half-dollar-reverse.webp', 'bicentennial-half-dollar-reverse-1976-official.webp'],
  ['1976-eisenhower-dollar-obverse.webp', 'bicentennial-dollar-obverse-1976-official.webp'],
  ['1976-bicentennial-dollar-reverse.webp', 'bicentennial-dollar-reverse-1976-official.webp']
];

async function coinCutout(source, destination) {
  const image = sharp(source).rotate().removeAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const corner = Math.max(2, Math.floor(Math.min(width, height) * 0.04));
  const samples = [];
  for (let y = 0; y < corner; y += 2) {
    for (let x = 0; x < corner; x += 2) {
      for (const [sampleX, sampleY] of [[x, y], [width - 1 - x, y], [x, height - 1 - y], [width - 1 - x, height - 1 - y]]) {
        const index = (sampleY * width + sampleX) * channels;
        samples.push([data[index], data[index + 1], data[index + 2]]);
      }
    }
  }
  const background = [0, 1, 2].map(channel => Math.round(samples.reduce((sum, value) => sum + value[channel], 0) / samples.length));
  const xs = [];
  const ys = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const index = (y * width + x) * channels;
      const difference = Math.hypot(data[index] - background[0], data[index + 1] - background[1], data[index + 2] - background[2]);
      if (difference > 32) {
        xs.push(x);
        ys.push(y);
      }
    }
  }
  if (xs.length < 100) throw new Error(`Unable to locate coin in ${path.basename(source)}`);
  xs.sort((a, b) => a - b);
  ys.sort((a, b) => a - b);
  const percentile = (values, fraction) => values[Math.max(0, Math.min(values.length - 1, Math.floor(values.length * fraction)))];
  const left = percentile(xs, 0.002);
  const right = percentile(xs, 0.998);
  const top = percentile(ys, 0.002);
  const bottom = percentile(ys, 0.998);
  const cropSize = Math.floor(Math.min(Math.max(right - left, bottom - top) + 12, Math.min(width, height)));
  const centerX = Math.round((left + right) / 2);
  const centerY = Math.round((top + bottom) / 2);
  const cropLeft = Math.max(0, Math.min(width - cropSize, Math.round(centerX - cropSize / 2)));
  const cropTop = Math.max(0, Math.min(height - cropSize, Math.round(centerY - cropSize / 2)));
  const target = 640;
  const mask = Buffer.from(`<svg width="${target}" height="${target}" xmlns="http://www.w3.org/2000/svg"><circle cx="${target / 2}" cy="${target / 2}" r="${target / 2 - 2}" fill="white"/></svg>`);
  const output = await sharp(source)
    .rotate()
    .extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
    .resize(target, target, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .webp({ quality: 88, alphaQuality: 100, effort: 6, smartSubsample: true })
    .toBuffer();
  fs.writeFileSync(destination, output);
}

(async () => {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const [sourceName, destinationName] of images) {
    const source = path.join(sourceRoot, sourceName);
    if (!fs.existsSync(source)) throw new Error(`Missing source image: ${source}`);
    await coinCutout(source, path.join(outputDir, destinationName));
    console.log(`Imported ${sourceName} -> ${destinationName}`);
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
