import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname, extname } from "path";

const SITE = "https://lencois.tur.br";
const ROOT = join(new URL("..", import.meta.url).pathname, "dist");
const PORT = 4173;
const LANGUAGES = ["pt", "en", "es"];

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// --- 0. Fetch dynamic slugs from Supabase ---

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "http://localhost";
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

let tourSlugs = [];
let packageSlugs = [];

try {
  const toursRes = await fetch(`${SUPABASE_URL}/rest/v1/public_tours?select=slug`, {
    headers: SUPABASE_HEADERS,
  });
  if (toursRes.ok) {
    const tours = await toursRes.json();
    tourSlugs = (tours || []).map((t) => t.slug).filter(Boolean);
    console.log(`\u2713  ${tourSlugs.length} tours carregados`);
  }

  const packagesRes = await fetch(`${SUPABASE_URL}/rest/v1/public_packages?select=slug`, {
    headers: SUPABASE_HEADERS,
  });
  if (packagesRes.ok) {
    const packages = await packagesRes.json();
    packageSlugs = (packages || []).map((p) => p.slug).filter(Boolean);
    console.log(`\u2713  ${packageSlugs.length} pacotes carregados`);
  }
} catch {
  console.log("\u26a0  Supabase indispon\u00edvel \u2014 p\u00e1ginas din\u00e2micas n\u00e3o ser\u00e3o pr\u00e9-renderizadas");
}

const STATIC_ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/passeios", priority: 0.9 },
  { path: "/translados", priority: 0.8 },
  { path: "/seguranca", priority: 0.7 },
  { path: "/politica-de-privacidade", priority: 0.5 },
  { path: "/assinatura-termo", priority: 0.3 },
];

const DYNAMIC_ROUTES = [
  ...tourSlugs.map((slug) => ({ path: `/passeios/${slug}`, priority: 0.7 })),
  ...packageSlugs.map((slug) => ({ path: `/pacotes/${slug}`, priority: 0.6 })),
];

// Generate routes for each language
const buildLangRoutes = (lang) => {
  const prefix = lang === "pt" ? "" : `/${lang}`;
  const langify = (p) => p === "/" ? (prefix || "/") : `${prefix}${p}`;
  return [
    ...STATIC_ROUTES.map((r) => ({ ...r, path: langify(r.path) })),
    ...DYNAMIC_ROUTES.map((r) => ({ ...r, path: langify(r.path) })),
  ];
};

const ALL_ROUTES = LANGUAGES.flatMap(buildLangRoutes);

// --- 1. Start static file server ---

const server = createServer((req, res) => {
  let filePath = join(ROOT, req.url === "/" ? "index.html" : req.url);
  try {
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      filePath = join(filePath, "index.html");
      if (!existsSync(filePath)) throw new Error("not found");
    }
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(content);
  } catch {
    const fallback = readFileSync(join(ROOT, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fallback);
  }
});

await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
console.log(`Preview: http://127.0.0.1:${PORT}`);

// --- 2. Prerender pages ---

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(30000);

page.on("pageerror", (err) => console.log("  [page error]", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("  [console error]", msg.text().slice(0, 120));
});

const prerenderRoute = async (route) => {
  const url = `http://127.0.0.1:${PORT}${route.path}`;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(3000);

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    const doctype = "<!doctype html>\n";

    const outPath = route.path === "/" ? "index.html" : `${route.path.slice(1)}/index.html`;
    const outDir = dirname(join(ROOT, outPath));
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    writeFileSync(join(ROOT, outPath), doctype + html);

    const title = html.match(/<title>([^<]*)/)?.[1] || "(no title)";
    console.log(`\u2713  ${route.path.padEnd(35)} \u2192 ${title.slice(0, 60)}`);
  } catch (e) {
    console.log(`\u2717  ${route.path.padEnd(35)} \u2192 ${e.message.slice(0, 80)}`);
  }
};

for (const route of ALL_ROUTES) {
  await prerenderRoute(route);
}

await browser.close();

// --- 3. Sitemap ---

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ALL_ROUTES.map((r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <priority>${r.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

writeFileSync(join(ROOT, "sitemap.xml"), xml);
console.log(`\u2713  sitemap.xml gerado com ${ALL_ROUTES.length} URLs`);

server.close();
console.log("\nPrerender conclu\u00eddo.");
