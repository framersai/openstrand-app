/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const marketingRoutes = require('../src/config/marketing-routes.json');

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://openstrand.ai';
const defaultLocale = 'en';
const locales = ['en', 'zh-CN', 'es', 'hi', 'ar', 'ja', 'ko', 'pt', 'ru', 'fr'];

const additionalRoutes = ['/contact', '/about', '/privacy', '/terms', '/cookies', '/accessibility'];

function buildLocalePath(locale, routePath) {
  const normalizedPath = routePath === '/' ? '' : routePath;
  return `/${locale}${normalizedPath}`;
}

function dedupePaths(paths) {
  return Array.from(new Set(paths));
}

function generateSitemapEntries() {
  const entries = [];

  locales.forEach((locale) => {
    marketingRoutes.forEach((route) => {
      entries.push(buildLocalePath(locale, route.path));
    });
    additionalRoutes.forEach((route) => {
      entries.push(buildLocalePath(locale, route));
    });
  });

  // Include locale root pages
  locales.forEach((locale) => {
    entries.push(`/${locale}`);
  });

  return dedupePaths(entries);
}

function buildSitemapXml(urls) {
  const xmlEntries = urls
    .map((url) => {
      const loc = `${siteUrl}${url}`;
      return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${url === `/${defaultLocale}` ? '1.0' : '0.7'}</priority></url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlEntries}</urlset>`;
}

function ensurePublicDir() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  return publicDir;
}

function maybeWriteRobots(publicDir) {
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    return;
  }

  const robotsContent = `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
  fs.writeFileSync(robotsPath, robotsContent);
  console.log(`Created robots.txt`);
}

function main() {
  const urls = generateSitemapEntries();
  const sitemap = buildSitemapXml(urls);
  const publicDir = ensurePublicDir();
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`Generated sitemap with ${urls.length} routes at ${sitemapPath}`);
  maybeWriteRobots(publicDir);
}

main();
