import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const baseUrl = 'https://stylistedge.in';
    const staticUrls = ['/', '/menu', '/book'];

    // Attempt to read categories from public/database.json to include in sitemap (if useful)
    const dbPath = path.join(process.cwd(), 'public', 'database.json');
    let categories: string[] = [];
    try {
      const raw = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categories)) {
        categories = parsed.categories.map((c: any) => `/menu#${c.id}`);
      }
    } catch (e) {
      // ignore if missing
    }

    const urls = [...staticUrls, ...categories];
    const lastmod = new Date().toISOString();

    const xml = [`<?xml version="1.0" encoding="UTF-8"?>`, `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`]
      .concat(
        urls.map((u) => {
          return `  <url>\n    <loc>${baseUrl}${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
        })
      )
      .concat(['</urlset>'])
      .join('\n');

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (err) {
    return new Response('Failed to generate sitemap', { status: 500 });
  }
}
