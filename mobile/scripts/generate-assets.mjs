// The Reflector - Asset Generator
// Generates all required icon, splash, and store imagery from a single 1024x1024 source logo.
//
// Usage:
//   node scripts/generate-assets.mjs
//   node scripts/generate-assets.mjs --source assets/images/MyLogo.png
//
// Outputs:
//   assets/images/                          - Expo-wired assets (icon, splash, adaptive-icon, favicon)
//   assets/generated/ios/AppIcon.appiconset - Full iOS AppIcon set (all sizes + Contents.json)
//   assets/generated/android/mipmap-DENSITY - Android mipmap densities
//   assets/generated/store/                 - App Store and Play Store artwork
//   ios/TheReflector/.../AppIcon.appiconset - Synced to native iOS project
//   android/app/src/main/res/mipmap-DENSITY - Synced to native Android project

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Config ────────────────────────────────────────────────────────────────────

const SOURCE = (() => {
  const flag = process.argv.indexOf('--source');
  return flag !== -1
    ? path.resolve(process.argv[flag + 1])
    : path.join(ROOT, 'assets', 'images', 'Logo_1024.png');
})();

const SPLASH_BG   = { r: 13, g: 13, b: 13, alpha: 1 };    // matches surface0 #0D0D0D
const ICON_BG     = { r: 13, g: 13, b: 13, alpha: 1 };
const ANDROID_BG  = '#0D0D0D';

// ── Output Directories ────────────────────────────────────────────────────────

const DIRS = {
  expo:    path.join(ROOT, 'assets', 'images'),
  ios:     path.join(ROOT, 'assets', 'generated', 'ios', 'AppIcon.appiconset'),
  android: path.join(ROOT, 'assets', 'generated', 'android'),
  store:   path.join(ROOT, 'assets', 'generated', 'store'),
};

// Native project paths (written by `expo prebuild`)
const NATIVE = {
  ios: (() => {
    // expo prebuild can name the folder after the project name
    const candidates = ['ios/thereflector', 'ios/TheReflector', 'ios/the-reflector'];
    for (const c of candidates) {
      const full = path.join(ROOT, c, 'Images.xcassets', 'AppIcon.appiconset');
      if (fs.existsSync(full)) return full;
    }
    return null;
  })(),
  android: path.join(ROOT, 'android', 'app', 'src', 'main', 'res'),
};

for (const dir of Object.values(DIRS)) {
  fs.mkdirSync(dir, { recursive: true });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resize(size, outPath, opts = {}) {
  const {
    padding = 0,
    bg = null,
    format = 'png',
  } = opts;

  let pipeline = sharp(SOURCE).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

  if (padding > 0) {
    // Add padding: shrink logo then composite on background
    const innerSize = Math.round(size * (1 - padding * 2));
    const logoBuffer = await sharp(SOURCE)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 },
      },
    }).composite([{ input: logoBuffer, gravity: 'center' }]);
  } else if (bg) {
    const logoBuffer = await sharp(SOURCE)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    pipeline = sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bg,
      },
    }).composite([{ input: logoBuffer, gravity: 'center' }]);
  }

  await pipeline.png().toFile(outPath);
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓  ${path.relative(ROOT, outPath).padEnd(60)} ${size}×${size}  ${kb}kb`);
}

async function resizeSplash(width, height, logoScale, outPath, bg = SPLASH_BG) {
  const logoSize = Math.round(Math.min(width, height) * logoScale);
  const logoBuffer = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width, height, channels: 4, background: bg },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(outPath);

  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`  ✓  ${path.relative(ROOT, outPath).padEnd(60)} ${width}×${height}  ${kb}kb`);
}

// ── 1. Expo Standard Assets ───────────────────────────────────────────────────

async function generateExpoAssets() {
  console.log('\n📱 Expo standard assets (app.json wired)');

  // icon.png — 1024×1024, dark bg, small padding so it breathes in the squircle
  await resize(1024, path.join(DIRS.expo, 'icon.png'), { bg: ICON_BG, padding: 0.1 });

  // splash-logo.png - square, transparent bg, no extra padding
  // This is what expo-splash-screen plugin uses (imageWidth: 400 in app.json)
  await resize(1024, path.join(DIRS.expo, 'splash-logo.png'), { padding: 0 });

  // adaptive-icon.png — 1024×1024, foreground only (Android adds its own bg)
  // Expo recommends transparent bg for adaptive icon foreground
  await resize(1024, path.join(DIRS.expo, 'adaptive-icon.png'), { padding: 0.15 });

  // favicon.png — 32×32 for web
  await resize(32, path.join(DIRS.expo, 'favicon.png'), { bg: ICON_BG });

  // splash-icon.png — 1284×2778 (iPhone 14 Pro Max 3x), logo centered at 45%
  await resizeSplash(1284, 2778, 0.45, path.join(DIRS.expo, 'splash-icon.png'));
}

// ── 2. iOS AppIcon Set ────────────────────────────────────────────────────────

const IOS_SIZES = [
  // iPhone Notification
  { size: 40,   scale: 2, idiom: 'iphone', role: 'notification' },
  { size: 60,   scale: 3, idiom: 'iphone', role: 'notification' },
  // iPhone Settings
  { size: 58,   scale: 2, idiom: 'iphone', role: 'settings' },
  { size: 87,   scale: 3, idiom: 'iphone', role: 'settings' },
  // iPhone Spotlight
  { size: 80,   scale: 2, idiom: 'iphone', role: 'spotlight' },
  { size: 120,  scale: 3, idiom: 'iphone', role: 'spotlight' },
  // iPhone App
  { size: 120,  scale: 2, idiom: 'iphone', role: 'app' },
  { size: 180,  scale: 3, idiom: 'iphone', role: 'app' },
  // iPad Notification
  { size: 20,   scale: 1, idiom: 'ipad', role: 'notification' },
  { size: 40,   scale: 2, idiom: 'ipad', role: 'notification' },
  // iPad Settings
  { size: 29,   scale: 1, idiom: 'ipad', role: 'settings' },
  { size: 58,   scale: 2, idiom: 'ipad', role: 'settings' },
  // iPad Spotlight
  { size: 40,   scale: 1, idiom: 'ipad', role: 'spotlight' },
  { size: 80,   scale: 2, idiom: 'ipad', role: 'spotlight' },
  // iPad App
  { size: 76,   scale: 1, idiom: 'ipad', role: 'app' },
  { size: 152,  scale: 2, idiom: 'ipad', role: 'app' },
  // iPad Pro
  { size: 167,  scale: 2, idiom: 'ipad', role: 'app-ipad-pro' },
  // App Store
  { size: 1024, scale: 1, idiom: 'ios-marketing', role: 'marketing' },
];

async function generateiOSIcons() {
  console.log('\n🍎 iOS AppIcon.appiconset');

  const images = [];

  for (const item of IOS_SIZES) {
    const filename = `icon-${item.size}.png`;
    const outPath = path.join(DIRS.ios, filename);
    await resize(item.size, outPath, { bg: ICON_BG, padding: 0.1 });

    images.push({
      filename,
      idiom: item.idiom,
      scale: `${item.scale}x`,
      size: `${Math.round(item.size / item.scale)}x${Math.round(item.size / item.scale)}`,
    });
  }

  // Write Contents.json so Xcode picks it up automatically
  const contents = {
    images: images.map((img) => ({
      filename: img.filename,
      idiom: img.idiom,
      scale: img.scale,
      size: img.size,
    })),
    info: { author: 'the-reflector-asset-generator', version: 1 },
  };

  const contentsPath = path.join(DIRS.ios, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(contents, null, 2));
  console.log(`  ✓  ${path.relative(ROOT, contentsPath).padEnd(60)} Contents.json`);
}

// ── 3. Android Mipmap Icons ───────────────────────────────────────────────────

const ANDROID_DENSITIES = [
  { density: 'mdpi',    size: 48  },
  { density: 'hdpi',    size: 72  },
  { density: 'xhdpi',   size: 96  },
  { density: 'xxhdpi',  size: 144 },
  { density: 'xxxhdpi', size: 192 },
];

async function generateAndroidIcons() {
  console.log('\n🤖 Android mipmap icons');

  for (const { density, size } of ANDROID_DENSITIES) {
    const dir = path.join(DIRS.android, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.png — with bg
    await resize(size, path.join(dir, 'ic_launcher.png'), { bg: ICON_BG, padding: 0.1 });

    // ic_launcher_round.png — same, Expo/Android uses this for circle crop
    await resize(size, path.join(dir, 'ic_launcher_round.png'), { bg: ICON_BG, padding: 0.1 });

    // ic_launcher_foreground.png — transparent bg, for adaptive icon
    await resize(size, path.join(dir, 'ic_launcher_foreground.png'), { padding: 0.2 });
  }
}

// ── 4. Store Marketing Assets ─────────────────────────────────────────────────

async function generateStoreAssets() {
  console.log('\n🏪 Store marketing assets');

  // App Store icon (required, no alpha)
  await resize(1024, path.join(DIRS.store, 'appstore-icon-1024.png'), { bg: ICON_BG, padding: 0.1 });

  // Google Play icon
  await resize(512, path.join(DIRS.store, 'playstore-icon-512.png'), { bg: ICON_BG, padding: 0.1 });

  // Google Play feature graphic (1024×500)
  const logoSize = 300;
  const logoBuffer = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: 1024, height: 500, channels: 4, background: SPLASH_BG },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(DIRS.store, 'playstore-feature-graphic-1024x500.png'));

  console.log(`  ✓  ${'assets/generated/store/playstore-feature-graphic-1024x500.png'.padEnd(60)} 1024×500`);

  // iPad splash — 2048×2732
  await resizeSplash(2048, 2732, 0.28, path.join(DIRS.store, 'splash-ipad-2048x2732.png'));

  // iPhone 6.7" splash — 1290×2796
  await resizeSplash(1290, 2796, 0.32, path.join(DIRS.store, 'splash-iphone-1290x2796.png'));

  // iPhone 6.1" splash — 1179×2556
  await resizeSplash(1179, 2556, 0.32, path.join(DIRS.store, 'splash-iphone-1179x2556.png'));

  // Android phone splash — 1080×1920
  await resizeSplash(1080, 1920, 0.35, path.join(DIRS.store, 'splash-android-1080x1920.png'));
}

// ── 5. Sync to Native Projects ────────────────────────────────────────────────

async function syncToNative() {
  console.log('\n🔗 Syncing to native projects');

  // iOS: copy the 1024px icon into the AppIcon.appiconset
  if (NATIVE.ios) {
    const src  = path.join(DIRS.expo, 'icon.png');
    const dest = path.join(NATIVE.ios, 'App-Icon-1024x1024@1x.png');
    fs.copyFileSync(src, dest);
    console.log(`  ✓  ${path.relative(ROOT, dest).padEnd(60)} iOS AppIcon`);
  } else {
    console.log('  ⚠  iOS native project not found — run `expo prebuild` first');
  }

  // Android: sharp can write webp natively
  const ANDROID_DENSITIES = [
    { density: 'mdpi',    size: 48  },
    { density: 'hdpi',    size: 72  },
    { density: 'xhdpi',   size: 96  },
    { density: 'xxhdpi',  size: 144 },
    { density: 'xxxhdpi', size: 192 },
  ];

  for (const { density, size } of ANDROID_DENSITIES) {
    const dir = path.join(NATIVE.android, `mipmap-${density}`);
    if (!fs.existsSync(dir)) {
      console.log(`  ⚠  ${dir} not found — skipping`);
      continue;
    }

    // Write webp directly via sharp (no sips dependency)
    const innerSize = Math.round(size * 0.8);
    const logoBuffer = await sharp(SOURCE)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const withBg = await sharp({
      create: { width: size, height: size, channels: 4, background: ICON_BG },
    })
      .composite([{ input: logoBuffer, gravity: 'center' }])
      .png()
      .toBuffer();

    const transparent = await sharp(SOURCE)
      .resize(Math.round(size * 0.7), Math.round(size * 0.7), { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.round(size * 0.15), bottom: Math.round(size * 0.15),
        left: Math.round(size * 0.15), right: Math.round(size * 0.15),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    await sharp(withBg).webp({ lossless: true }).toFile(path.join(dir, 'ic_launcher.webp'));
    await sharp(withBg).webp({ lossless: true }).toFile(path.join(dir, 'ic_launcher_round.webp'));
    await sharp(transparent).webp({ lossless: true }).toFile(path.join(dir, 'ic_launcher_foreground.webp'));

    console.log(`  ✓  android/mipmap-${density}  (ic_launcher + round + foreground)`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═════════════════════════════════════════════════════════════');
  console.log('  THE REFLECTOR — Asset Generator');
  console.log(`  Source: ${path.relative(ROOT, SOURCE)}`);
  console.log('═════════════════════════════════════════════════════════════');

  if (!fs.existsSync(SOURCE)) {
    console.error(`\n❌  Source file not found: ${SOURCE}`);
    process.exit(1);
  }

  const meta = await sharp(SOURCE).metadata();
  console.log(`  Input: ${meta.width}×${meta.height} ${meta.format?.toUpperCase()}`);

  const t0 = Date.now();

  await generateExpoAssets();
  await generateiOSIcons();
  await generateAndroidIcons();
  await generateStoreAssets();
  await syncToNative();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log(`  ✅  Done in ${elapsed}s`);
  console.log('');
  console.log('  Expo assets  >  assets/images/  (app.json already wired)');
  console.log('  iOS icons    >  assets/generated/ios/AppIcon.appiconset/');
  console.log('               >  ios/.../AppIcon.appiconset/  (native)');
  console.log('  Android      >  assets/generated/android/mipmap-*/');
  console.log('               >  android/app/src/main/res/mipmap-*/  (native)');
  console.log('  Store art    >  assets/generated/store/');
  console.log('');
  console.log('  Next: expo run:ios / expo run:android to rebuild the native app.');
  console.log('═════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌  Error:', err.message);
  process.exit(1);
});
