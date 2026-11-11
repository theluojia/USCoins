const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let sharp;
try { sharp = require('sharp'); }
catch (_) { sharp = require('\\\\wsl.localhost\\Ubuntu-22.04\\home\\victor\\node_modules\\sharp'); }

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = process.argv[2];
const supplementalRoot = process.argv[3] || '';
if (!sourceRoot || !fs.existsSync(sourceRoot)) {
  throw new Error('Usage: node scripts/build-local-images.cjs <official-image-directory>');
}

global.window = {};
require(path.join(projectRoot, 'js', 'translations.js'));
require(path.join(projectRoot, 'js', 'data.js'));
const coins = window.US_COINS || [];

const outputDir = path.join(projectRoot, 'assets', 'coins');
const manifestPath = path.join(projectRoot, 'js', 'coin-images.js');
const reportPath = path.join(projectRoot, 'scripts', 'coin-image-report.json');
const expectedOutput = path.join(projectRoot, 'assets', 'coins');
if (path.resolve(outputDir) !== path.resolve(expectedOutput)) throw new Error('Unexpected output directory');
fs.mkdirSync(outputDir, { recursive: true });

const folderBySeries = {
  'U.S. Bicentennial Coinage': '1976 Bicentennial Coins',
  '50 State Quarters': '50 State Quarters',
  'D.C. & U.S. Territories': 'D.C. and U.S. Territories Quarters',
  'America the Beautiful': 'America the Beautiful Quarters',
  'Washington Quarter': '2021 General George Washington Crossing the Delaware Quarter',
  'American Women Quarters': 'American Women Quarters',
  'Semiquincentennial': '2026 Semiquincentennial Coins',
  'Sacagawea Dollar': 'Native American $1 Coins',
  'Native American Dollar': 'Native American $1 Coins',
  'Presidential Dollar': 'The Presidential $1 Coin',
  'American Innovation': 'American Innovation $1 Coin',
  'Westward Journey': 'The Westward Journey Nickels'
  ,'Lincoln Bicentennial One Cent': 'Lincoln Bicentennial One Cent Coins'
};

const stopWords = new Set([
  'the','of','and','a','an','dr','hon','rev','general','coin','coins','series','uncirculated','unc','circulating',
  'quarter','quarters','dollar','dollars','one','half','nickel','dime','united','states','us','american'
]);

const normalize = value => String(value)
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/&/g, ' and ').replace(/\$/g, ' dollar ')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = value => normalize(value).split(/\s+/).filter(token => token.length > 1 && !stopWords.has(token));
const yearsOf = coin => String(coin.year).match(/\d{4}/g) || [];

function listImages(root) {
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.toLowerCase() === 'small') continue;
      results.push(...listImages(full));
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      const relative = path.relative(sourceRoot, full);
      results.push({
        full,
        relative,
        folder: relative.split(path.sep)[0],
        name: entry.name,
        normalized: normalize(entry.name),
        extension: path.extname(entry.name).toLowerCase()
      });
    }
  }
  return results;
}

const allImages = listImages(sourceRoot);

function preferredTerms(coin, side) {
  if (coin.series === 'U.S. Bicentennial Coinage') {
    if (coin.denomination === '25¢') return tokens('george washington bicentennial quarter');
    if (coin.denomination === '50¢') return tokens('john f kennedy bicentennial half dollar');
    if (coin.denomination === '$1') return tokens('dwight eisenhower bicentennial one dollar');
  }
  if (coin.series === 'Westward Journey' && coin.name === 'Peace Medal') return tokens('louisiana purchase');
  if (coin.series === 'Lincoln Bicentennial One Cent' && coin.name === 'Formative Years') return tokens('youth indiana');
  if (coin.series === 'Sacagawea Dollar') return tokens('2008 native american');
  if (coin.series === 'Semiquincentennial') {
    if (coin.denomination === '10¢') return ['semiq','dime'];
    if (coin.denomination === '5¢') return ['semiq','nickel'];
    if (coin.denomination === '50¢') return ['semiq','half','dollar'];
  }
  if (side === 'obverse' && ['50 State Quarters','D.C. & U.S. Territories','America the Beautiful','American Women Quarters','American Innovation'].includes(coin.series)) {
    return [];
  }
  return tokens(coin.name);
}

function selectSource(coin, side) {
  const override = (() => {
    if (coin.series === 'Presidential Dollar' && coin.year === '2012' && side === 'reverse') {
      return path.join(sourceRoot, 'The Presidential $1 Coin', '2012-presidential-dollar-coin-rutherford-b-hayes-uncirculated-obverse.jpg');
    }
    if (coin.series === 'U.S. Bicentennial Coinage' && coin.name === 'Independence Hall' && side === 'reverse') {
      return path.join(sourceRoot, '1976 Bicentennial Coins', '800px-1976-S_50C_Clad_Deep_Cameo_(rev).jpg');
    }
    if (!supplementalRoot) return '';
    if (coin.id === '1-2026-president-donald-j-trump') {
      return path.join(supplementalRoot, `Donald-Trump-Circulating-Dollar-${side === 'obverse' ? 'Obverse' : 'Reverse'}.jpg`);
    }
    if (coin.name === '1776 ~ 2026 Penny') {
      return path.join(supplementalRoot, `SemiQ-Penny-${side === 'obverse' ? 'Obverse-Unc-D' : 'Reverse-Unc'}.jpg`);
    }
    return '';
  })();
  if (override && fs.existsSync(override)) {
    const supplemental = supplementalRoot && path.resolve(override).startsWith(path.resolve(supplementalRoot));
    const relative = supplemental ? `supplemental/${path.basename(override)}` : path.relative(sourceRoot, override);
    return { image: { full: override, relative, extension: path.extname(override).toLowerCase() }, score: 1000 };
  }
  if (coin.id === '1-2026-president-donald-j-trump' || coin.name === '1776 ~ 2026 Penny') return null;
  const folder = folderBySeries[coin.series];
  if (!folder) return null;
  const candidates = allImages.filter(image => image.folder === folder && image.normalized.includes(side));
  if (!candidates.length) return null;
  const years = yearsOf(coin);
  const terms = preferredTerms(coin, side);
  const nonProof = candidates.filter(image => !image.normalized.includes('proof'));
  const pool = nonProof.length ? nonProof : candidates;

  const ranked = pool.map(image => {
    let score = 0;
    const matchedYears = years.filter(year => image.normalized.includes(year));
    score += matchedYears.length * 55;
    const matchedTerms = terms.filter(term => image.normalized.includes(term));
    score += matchedTerms.length * 28;
    if (terms.length && matchedTerms.length === terms.length) score += 70;
    if (image.extension === '.png') score += 12;
    if (image.normalized.includes('uncirculated') || image.normalized.includes(' unc ')) score += 10;
    if (image.normalized.includes('philadelphia') || image.normalized.includes(' unc p')) score += 3;
    if (image.normalized.includes('denver') || image.normalized.includes(' unc d')) score -= 2;
    if (image.normalized.includes('silver') || image.normalized.includes('reverse proof')) score -= 500;
    return { image, score, matchedYears, matchedTerms };
  }).sort((a, b) => b.score - a.score || a.image.relative.localeCompare(b.image.relative));

  const best = ranked[0];
  const needsName = side === 'reverse' && terms.length > 0 && ![
    'Sacagawea Dollar','Native American Dollar','Presidential Dollar'
  ].includes(coin.series) && !(coin.series === 'American Innovation' && coin.name === 'Introductory Coin');
  const needsYear = years.length > 0 && ![
    'U.S. Bicentennial Coinage','Sacagawea Dollar','Semiquincentennial'
  ].includes(coin.series);
  if (needsName && best.matchedTerms.length === 0) return null;
  if (needsYear && best.matchedYears.length === 0) return null;
  return best;
}

async function opaqueCoinCutout(source) {
  const image = sharp(source).rotate().removeAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const corner = Math.max(2, Math.floor(Math.min(width, height) * 0.04));
  const samples = [];
  for (let y = 0; y < corner; y += 2) {
    for (let x = 0; x < corner; x += 2) {
      for (const [sx, sy] of [[x,y],[width-1-x,y],[x,height-1-y],[width-1-x,height-1-y]]) {
        const i = (sy * width + sx) * channels;
        samples.push([data[i], data[i+1], data[i+2]]);
      }
    }
  }
  const background = [0,1,2].map(channel => Math.round(samples.reduce((sum, value) => sum + value[channel], 0) / samples.length));
  const xs = [], ys = [];
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * channels;
      const diff = Math.hypot(data[i]-background[0], data[i+1]-background[1], data[i+2]-background[2]);
      if (diff > 32) { xs.push(x); ys.push(y); }
    }
  }
  if (xs.length < 100) return sharp(source).rotate().ensureAlpha();
  xs.sort((a,b)=>a-b); ys.sort((a,b)=>a-b);
  const percentile = (values, p) => values[Math.max(0, Math.min(values.length-1, Math.floor(values.length*p)))];
  const left = percentile(xs, .002), right = percentile(xs, .998);
  const top = percentile(ys, .002), bottom = percentile(ys, .998);
  const diameter = Math.min(Math.max(right-left, bottom-top) + 6, Math.min(width, height));
  const centerX = Math.round((left+right)/2), centerY = Math.round((top+bottom)/2);
  const cropLeft = Math.max(0, Math.min(width-diameter, Math.round(centerX-diameter/2)));
  const cropTop = Math.max(0, Math.min(height-diameter, Math.round(centerY-diameter/2)));
  const cropSize = Math.floor(diameter);
  const lowResolutionBicentennialHalf = path.basename(source).toLowerCase() === '1976-john-f-kennedy-bicentennial-half-dollar-obverse.jpg';
  const target = lowResolutionBicentennialHalf ? 420 : Math.min(640, cropSize);
  const mask = Buffer.from(`<svg width="${target}" height="${target}" xmlns="http://www.w3.org/2000/svg"><circle cx="${target/2}" cy="${target/2}" r="${target/2-1}" fill="white"/></svg>`);
  let pipeline = sharp(source).rotate().extract({ left: cropLeft, top: cropTop, width: cropSize, height: cropSize })
    .resize(target, target, { fit: 'fill', kernel: sharp.kernel.lanczos3 });
  if (lowResolutionBicentennialHalf) pipeline = pipeline.sharpen(0.8);
  return pipeline.ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]);
}

async function convert(source, destination) {
  const metadata = await sharp(source).metadata();
  let pipeline;
  if (metadata.hasAlpha) {
    const trimmed = await sharp(source).rotate().trim().toBuffer({ resolveWithObject: true });
    const target = Math.min(640, Math.max(trimmed.info.width, trimmed.info.height));
    pipeline = sharp(trimmed.data).resize(target, target, {
      fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, withoutEnlargement: true
    });
  } else {
    pipeline = await opaqueCoinCutout(source);
  }
  await pipeline.webp({ quality: 88, alphaQuality: 100, effort: 6, smartSubsample: true }).toFile(destination);
}

(async () => {
  const selections = {};
  const report = [];
  const sourceFiles = new Map();
  for (const coin of coins) {
    selections[coin.id] = {};
    for (const side of ['obverse','reverse']) {
      const selected = selectSource(coin, side);
      report.push({
        id: coin.id, series: coin.series, year: coin.year, name: coin.name, side,
        source: selected?.image.relative || null, score: selected?.score ?? null
      });
      if (!selected) continue;
      const source = selected.image.full;
      sourceFiles.set(selected.image.relative, source);
      const stem = normalize(path.basename(source, path.extname(source))).replace(/ /g, '-').slice(0, 90);
      const hash = crypto.createHash('sha1').update(selected.image.relative).digest('hex').slice(0, 8);
      const filename = `${stem}-${hash}.webp`;
      selections[coin.id][side] = `assets/coins/${filename}`;
    }
  }

  const uniqueSources = new Map();
  for (const item of report) {
    if (!item.source) continue;
    const mapped = selections[item.id][item.side];
    uniqueSources.set(item.source, mapped);
  }
  let completed = 0;
  for (const [relative, mapped] of uniqueSources) {
    const destination = path.join(projectRoot, mapped);
    if (!fs.existsSync(destination)) await convert(sourceFiles.get(relative), destination);
    completed++;
    if (completed % 25 === 0) console.log(`Converted ${completed}/${uniqueSources.size}`);
  }

  const manifest = `window.US_COIN_IMAGES=${JSON.stringify(selections, null, 2)};\n`;
  fs.writeFileSync(manifestPath, manifest);
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceRoot,
    coins: coins.length,
    faces: report.length,
    matchedFaces: report.filter(item => item.source).length,
    uniqueImages: uniqueSources.size,
    items: report
  }, null, 2));
  const expectedFiles = new Set([...uniqueSources.values()].map(value => path.basename(value)));
  for (const name of fs.readdirSync(outputDir)) {
    if (!expectedFiles.has(name)) fs.rmSync(path.join(outputDir, name), { force: true });
  }
  const bytes = fs.readdirSync(outputDir).reduce((sum, name) => sum + fs.statSync(path.join(outputDir, name)).size, 0);
  console.log(JSON.stringify({ coins: coins.length, faces: report.length, matchedFaces: report.filter(item=>item.source).length, uniqueImages: uniqueSources.size, outputMB: +(bytes/1024/1024).toFixed(2) }, null, 2));
})().catch(error => { console.error(error); process.exit(1); });
