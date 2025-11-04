import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import favicons from 'favicons';

const ROOT = process.cwd();
const LOGO_DIR = path.resolve(ROOT, 'public', 'logos');
const FAVICON_DIR = path.resolve(ROOT, 'public', 'favicons');
const IMAGES_DIR = path.resolve(ROOT, 'public', 'images');

const PNG_SIZES = [1024, 512, 256, 128, 64, 32];
const DARK_BG = '#050816';
const LIGHT_BG = '#ffffff';

interface VariantConfig {
  name: string;
  sourcePath: string;
  colorTransforms?: Record<string, string>;
  background?: string;
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadSvg(variant: VariantConfig): Promise<string> {
  let svg = await fs.readFile(variant.sourcePath, 'utf8');

  if (variant.colorTransforms) {
    for (const [from, to] of Object.entries(variant.colorTransforms)) {
      const regex = new RegExp(from, 'gi');
      svg = svg.replace(regex, to);
    }
  }

  return svg;
}

async function createPngVariants(name: string, svgContent: string, background?: string) {
  for (const size of PNG_SIZES) {
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(size, size, { fit: 'contain' })
      .png()
      .toBuffer();

    let finalBuffer = pngBuffer;

    if (background) {
      finalBuffer = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background,
        },
      })
        .composite([{ input: pngBuffer }])
        .png()
        .toBuffer();
    }

    const outPath = path.join(LOGO_DIR, `${name}-${size}.png`);
    await fs.writeFile(outPath, finalBuffer);
  }
}

async function generateLogos() {
  const variants: VariantConfig[] = [
    {
      name: 'logo-light',
      sourcePath: path.join(LOGO_DIR, 'openstrand-logo-gradient.svg'),
      background: LIGHT_BG,
    },
    {
      name: 'logo-dark',
      sourcePath: path.join(LOGO_DIR, 'openstrand-logo-gradient.svg'),
      colorTransforms: {
        '#3b82f6': '#93c5fd',
        '#10b981': '#34d399',
      },
      background: DARK_BG,
    },
    {
      name: 'logo-mono',
      sourcePath: path.join(LOGO_DIR, 'openstrand-logo-mono.svg'),
      background: LIGHT_BG,
    },
    {
      name: 'icon-light',
      sourcePath: path.join(LOGO_DIR, 'openstrand-icon.svg'),
      background: LIGHT_BG,
    },
    {
      name: 'icon-dark',
      sourcePath: path.join(LOGO_DIR, 'openstrand-icon.svg'),
      colorTransforms: {
        '#3b82f6': '#93c5fd',
      },
      background: DARK_BG,
    },
  ];

  for (const variant of variants) {
    const svg = await loadSvg(variant);
    const baseSvgPath = path.join(LOGO_DIR, `${variant.name}.svg`);
    await fs.writeFile(baseSvgPath, svg, 'utf8');
    await createPngVariants(variant.name, svg, variant.background);
  }
}

async function generateFavicons() {
  const baseIconPath = path.join(LOGO_DIR, 'icon-light-512.png');

  const config = {
    path: '/favicons',
    appName: 'OpenStrand',
    appShortName: 'OpenStrand',
    appDescription: 'Knowledge strands for teams',
    developerName: 'Frame.dev',
    background: LIGHT_BG,
    theme_color: '#3b82f6',
    icons: {
      favicons: true,
      android: true,
      appleIcon: true,
      appleStartup: false,
      coast: false,
      firefox: false,
      windows: false,
      yandex: false,
    },
  } as const;

  const response = await favicons(baseIconPath, config);

  for (const image of response.images) {
    const outPath = path.join(FAVICON_DIR, image.name);
    await fs.writeFile(outPath, image.contents);
  }

  for (const file of response.files) {
    const outPath = path.join(FAVICON_DIR, file.name);
    await fs.writeFile(outPath, file.contents);
  }

  // Convenience copy for Next.js default favicon
  const faviconIco = response.images.find((img) => img.name === 'favicon.ico');
  if (faviconIco) {
    await fs.writeFile(path.join(ROOT, 'public', 'favicon.ico'), faviconIco.contents);
  }
}

async function generateOpenGraphImage() {
  const ogWidth = 1200;
  const ogHeight = 630;

  const logoBuffer = await sharp(path.join(LOGO_DIR, 'logo-light-1024.png'))
    .resize(540, 540, { fit: 'contain' })
    .png()
    .toBuffer();

  const backgroundSvg = `
    <svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#0b1120" />
        </linearGradient>
      </defs>
      <rect width="${ogWidth}" height="${ogHeight}" fill="url(#bg-grad)" />
      <circle cx="240" cy="140" r="220" fill="#1e293b" opacity="0.35" />
      <circle cx="960" cy="520" r="260" fill="#38bdf8" opacity="0.22" />
    </svg>
  `;

  const textOverlay = `
    <svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font-family: 'Inter', 'Segoe UI', sans-serif; font-weight: 600; font-size: 72px; fill: #f8fafc; }
        .subtitle { font-family: 'Inter', 'Segoe UI', sans-serif; font-weight: 400; font-size: 32px; fill: #cbd5f5; }
      </style>
      <text x="600" y="270" class="title">OpenStrand</text>
      <text x="600" y="340" class="subtitle">Voice-aware knowledge strands for teams</text>
    </svg>
  `;

  const backgroundBuffer = await sharp(Buffer.from(backgroundSvg))
    .png()
    .toBuffer();

  const base = await sharp(backgroundBuffer)
    .composite([
      { input: logoBuffer, left: Math.round((ogWidth - 540) / 2), top: Math.round((ogHeight - 540) / 2) },
      { input: Buffer.from(textOverlay) },
    ])
    .png()
    .toBuffer();

  const outPath = path.join(IMAGES_DIR, 'og-default.png');
  await fs.writeFile(outPath, base);
}

async function main() {
  await ensureDir(LOGO_DIR);
  await ensureDir(FAVICON_DIR);
  await ensureDir(IMAGES_DIR);

  await generateLogos();
  await generateFavicons();
  await generateOpenGraphImage();

  console.log('✅ Logo assets, favicons, and OG image generated.');
}

main().catch((error) => {
  console.error('❌ Failed to export logo assets:', error);
  process.exit(1);
});
