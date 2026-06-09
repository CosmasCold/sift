// app/sitemap.xml/route.ts
const BASE_URL = "https://thesift.space";

export function GET() {
  const pages = [""].map(
    (path) => `<url><loc>${BASE_URL}${path}</loc><changefreq>monthly</changefreq></url>`
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "text/xml" },
  });
}