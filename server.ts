import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { INITIAL_NEWS_ARTICLES } from './src/data/initialNewsData';
import { DEFAULT_FEED_SOURCES, FALLBACK_IMAGES, DEFAULT_FALLBACK_IMAGE } from './src/config/appConfig';
import { Article, CollectorStatus, CollectorSyncResult, NewsCategory, NewsCountry } from './src/types/news';
import { slugify, normalizeTitleForDeduplication, calculateReadingTime, truncateText, cleanHtmlContent } from './src/utils/formatters';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'articles.json');
fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// In-memory persistent database for server session
let storedArticles: Article[] = (() => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...INITIAL_NEWS_ARTICLES];
  } catch { return [...INITIAL_NEWS_ARTICLES]; }
})();

function persistArticles() {
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(storedArticles), 'utf8'); } catch (err) { console.error('Could not persist article store:', err); }
}
let collectorStatus: CollectorStatus = {
  status: 'ONLINE',
  lastSync: new Date().toISOString(),
  totalArticles: storedArticles.length,
  newArticlesLastSync: 0,
  duplicateArticlesPrevented: 0,
  sourcesCount: DEFAULT_FEED_SOURCES.length,
  activeSources: DEFAULT_FEED_SOURCES.length,
  failedSources: 0,
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// Category classification heuristics
const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  AI: ['artificial intelligence', 'ai', 'machine learning', 'neural', 'deep learning', 'chatgpt', 'llm', 'generative ai', 'robotics'],
  Technology: ['software', 'hardware', 'cybersecurity', 'apple', 'google', 'microsoft', 'linux', 'chips', 'semiconductor', 'gadget', 'app', 'code'],
  Science: ['space', 'nasa', 'astronomy', 'quantum', 'physics', 'biology', 'ocean', 'telescope', 'jwst', 'cern', 'planet', 'mars'],
  Health: ['medicine', 'medical', 'hospital', 'cancer', 'vaccine', 'who', 'disease', 'fda', 'clinical', 'doctor', 'treatment', 'drug'],
  Business: ['market', 'stock', 'shares', 'inflation', 'economy', 'central bank', 'fed', 'investor', 'trade', 'gdp', 'profit', 'revenue'],
  Sports: ['football', 'soccer', 'tennis', 'olympics', 'cricket', 'rugby', 'nba', 'championship', 'formula 1', 'f1', 'premier league'],
  Entertainment: ['film', 'movie', 'actor', 'cinema', 'music', 'album', 'festival', 'oscar', 'tv series', 'hollywood', 'concert'],
  US: ['washington', 'biden', 'trump', 'senate', 'congress', 'white house', 'pentagon', 'us ', 'california', 'texas', 'american'],
  UK: ['london', 'westminster', 'parliament', 'britain', 'british', 'downing street', 'king charles', 'scotland', 'england'],
  Canada: ['ottawa', 'trudeau', 'toronto', 'vancouver', 'montreal', 'quebec', 'canadian', 'alberta', 'british columbia'],
  Australia: ['canberra', 'sydney', 'melbourne', 'queensland', 'australian', 'albanese', 'great barrier reef'],
  Politics: ['election', 'vote', 'summit', 'diplomacy', 'ambassador', 'legislation', 'treaty', 'sanctions', 'minister'],
  Lifestyle: ['architecture', 'design', 'recipe', 'diet', 'home', 'living', 'wellness', 'culture'],
  Travel: ['flight', 'airline', 'tourism', 'destination', 'hotel', 'resort', 'passport', 'cruise'],
  Weather: ['storm', 'hurricane', 'cyclone', 'flood', 'drought', 'forecast', 'meteorology', 'blizzard'],
  Trending: ['viral', 'breakthrough', 'record', 'historic', 'milestone', 'popular'],
  World: ['united nations', 'global', 'international', 'europe', 'asia', 'africa', 'treaty'],
};

function detectCategory(title: string, content: string = ''): NewsCategory {
  const text = `${title} ${content}`.toLowerCase();
  for (const kw of CATEGORY_KEYWORDS.AI) {
    if (text.includes(kw)) return 'AI';
  }
  let best: NewsCategory = 'World';
  let max = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [NewsCategory, string[]][]) {
    let count = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) count++;
    }
    if (count > max) {
      max = count;
      best = cat;
    }
  }
  return best;
}

function detectCountry(title: string, content: string = ''): NewsCountry {
  const text = `${title} ${content}`.toLowerCase();
  if (text.includes('united states') || text.includes('washington') || text.includes('american')) return 'United States';
  if (text.includes('united kingdom') || text.includes('london') || text.includes('britain') || text.includes('british')) return 'United Kingdom';
  if (text.includes('canada') || text.includes('canadian') || text.includes('ottawa')) return 'Canada';
  if (text.includes('australia') || text.includes('australian') || text.includes('sydney')) return 'Australia';
  if (text.includes('new zealand') || text.includes('auckland')) return 'New Zealand';
  if (text.includes('singapore')) return 'Singapore';
  return 'World';
}

// -------------------------------------------------------------
// ADMIN AUTH + EDITORIAL CRUD
// -------------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Akib9990';
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const adminSessions = new Map<string, number>();

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const expires = token ? adminSessions.get(token) : undefined;
  if (!expires || expires < Date.now()) {
    if (token) adminSessions.delete(token);
    return res.status(401).json({ success: false, message: 'Unauthorized admin session.' });
  }
  next();
}

function normalizeAdminArticle(input: Partial<Article>, existing?: Article): Article {
  const now = new Date().toISOString();
  const title = String(input.title || existing?.title || '').trim();
  const content = String(input.content || existing?.content || '').trim();
  const summary = String(input.summary || existing?.summary || truncateText(cleanHtmlContent(content), 220)).trim();
  const slugBase = String(input.slug || existing?.slug || title);
  return {
    id: String(input.id || existing?.id || crypto.randomUUID()),
    title,
    slug: slugify(slugBase),
    summary,
    content,
    image: String(input.image || existing?.image || DEFAULT_FALLBACK_IMAGE),
    imageCaption: String(input.imageCaption || existing?.imageCaption || ''),
    source: String(input.source || existing?.source || 'GlobalNews Today'),
    sourceUrl: String(input.sourceUrl || existing?.sourceUrl || ''),
    category: (input.category || existing?.category || 'World') as NewsCategory,
    country: (input.country || existing?.country || 'World') as NewsCountry,
    publishedAt: String(input.publishedAt || existing?.publishedAt || now),
    collectedAt: String(input.collectedAt || existing?.collectedAt || now),
    author: String(input.author || existing?.author || 'GlobalNews Today'),
    tags: Array.isArray(input.tags) ? input.tags.map(String) : (existing?.tags || []),
    isBreaking: Boolean(input.isBreaking ?? existing?.isBreaking),
    isFeatured: Boolean(input.isFeatured ?? existing?.isFeatured),
    isPublished: Boolean(input.isPublished ?? existing?.isPublished ?? true),
    readingTimeMinutes: calculateReadingTime(content),
  };
}

app.post('/api/admin/login', (req, res) => {
  const password = String(req.body?.password || '');
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, Date.now() + ADMIN_TOKEN_TTL_MS);
  res.json({ success: true, token, expiresIn: ADMIN_TOKEN_TTL_MS });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = String(req.headers.authorization || '').slice(7).trim();
  adminSessions.delete(token);
  res.json({ success: true });
});

app.get('/api/admin/articles', requireAdmin, (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 500, 1), 1000);
  res.json({ success: true, data: storedArticles.slice(0, limit), total: storedArticles.length });
});

app.post('/api/admin/articles', requireAdmin, (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ success: false, message: 'Headline is required.' });
  const article = normalizeAdminArticle(req.body);
  if (storedArticles.some(a => a.slug === article.slug)) article.slug = `${article.slug}-${Date.now().toString(36)}`;
  storedArticles.unshift(article);
  storedArticles = storedArticles.slice(0, 5000);
  persistArticles();
  collectorStatus.totalArticles = storedArticles.length;
  res.status(201).json({ success: true, data: article });
});

app.put('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const index = storedArticles.findIndex(a => a.id === req.params.id);
  if (index < 0) return res.status(404).json({ success: false, message: 'Article not found.' });
  const article = normalizeAdminArticle(req.body, storedArticles[index]);
  const duplicate = storedArticles.find((a, i) => i !== index && a.slug === article.slug);
  if (duplicate) article.slug = `${article.slug}-${Date.now().toString(36)}`;
  storedArticles[index] = article;
  storedArticles.sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  persistArticles();
  res.json({ success: true, data: article });
});

app.delete('/api/admin/articles/:id', requireAdmin, (req, res) => {
  const before = storedArticles.length;
  storedArticles = storedArticles.filter(a => a.id !== req.params.id);
  if (storedArticles.length === before) return res.status(404).json({ success: false, message: 'Article not found.' });
  persistArticles();
  collectorStatus.totalArticles = storedArticles.length;
  res.json({ success: true, message: 'Article deleted.' });
});

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GlobalNews Today API',
    articlesCount: storedArticles.length,
    timestamp: new Date().toISOString(),
  });
});

// Collector status endpoint
app.get('/api/collector/status', (req, res) => {
  res.json({
    success: true,
    data: collectorStatus,
  });
});

function publicArticle(article: Article) {
  const { source: _source, sourceUrl: _sourceUrl, ...safe } = article;
  return { ...safe, source: '', sourceUrl: '', author: 'GlobalNews Today' };
}
function publicArticles(articles: Article[]) { return articles.map(publicArticle); }

// All articles
app.get('/api/news', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 50, 1), 100);
  const offset = Math.max(parseInt(req.query.offset as string, 10) || 0, 0);
  const visible = storedArticles.filter(a => a.isPublished !== false);
  res.json({ success: true, data: publicArticles(visible.slice(offset, offset + limit)), total: visible.length, offset, limit, hasMore: offset + limit < visible.length });
});

// Latest articles
app.get('/api/news/latest', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 12, 1), 50);
  const visible = storedArticles.filter(a => a.isPublished !== false);
  res.json({ success: true, data: publicArticles(visible.slice(0, limit)), total: visible.length });
});

// Category articles
app.get('/api/news/category/:category', (req, res) => {
  const categoryParam = req.params.category.toLowerCase();
  const visible = storedArticles.filter(a => a.isPublished !== false);
  const filtered = visible.filter(
    a => a.category.toLowerCase() === categoryParam
  );
  res.json({
    success: true,
    data: publicArticles(filtered),
    category: req.params.category,
    count: filtered.length,
  });
});

// Country articles
app.get('/api/news/country/:country', (req, res) => {
  const countryParam = req.params.country.toLowerCase();
  const visible = storedArticles.filter(a => a.isPublished !== false);
  const filtered = visible.filter(a => a.country.toLowerCase() === countryParam);
  res.json({
    success: true,
    data: publicArticles(filtered),
    country: req.params.country,
    count: filtered.length,
  });
});

// Search articles
app.get('/api/news/search', (req, res) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  if (!q) {
    return res.json({ success: true, data: [], count: 0 });
  }

  const visible = storedArticles.filter(a => a.isPublished !== false);
  const results = visible.filter(a => {
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      a.source.toLowerCase().includes(q)
    );
  });

  res.json({
    success: true,
    query: q,
    data: publicArticles(results),
    count: results.length,
  });
});

// Single article by slug
app.get('/api/news/article/:slug', (req, res) => {
  const slug = req.params.slug;
  const article = storedArticles.find(a => a.isPublished !== false && a.slug === slug);
  if (!article) {
    return res.status(404).json({
      success: false,
      message: 'Article not found',
    });
  }
  res.json({
    success: true,
    data: publicArticle(article),
  });
});

// Feed Collector Trigger (POST /api/feed/collect)
app.post('/api/feed/collect', async (req, res) => {
  collectorStatus.status = 'SYNCING';

  const existingUrlSet = new Set(storedArticles.map(a => a.sourceUrl.toLowerCase().trim()));
  const existingTitleSet = new Set(storedArticles.map(a => normalizeTitleForDeduplication(a.title)));
  const existingIdSet = new Set(storedArticles.map(a => a.id));

  let fetchedCount = 0;
  let newCount = 0;
  let duplicateCount = 0;
  const failedSources: string[] = [];
  const newArticlesList: Article[] = [];

  for (const source of DEFAULT_FEED_SOURCES) {
    if (!source.enabled) continue;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'GlobalNewsToday-ServerCollector/1.0',
        },
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const xmlData = await resp.text();
      const parsed = xmlParser.parse(xmlData);
      const channel = parsed?.rss?.channel || parsed?.feed;
      const rawItems = channel?.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : (channel?.entry ? (Array.isArray(channel.entry) ? channel.entry : [channel.entry]) : []);

      for (const item of rawItems) {
        fetchedCount++;
        const title = cleanHtmlContent(item.title || '');
        const link = (typeof item.link === 'string' ? item.link : item.link?.['@_href'] || item.link?.href) || item.guid?.['#text'] || item.guid || item.id || '';
        const normTitle = normalizeTitleForDeduplication(title);
        const normUrl = link.toLowerCase().trim();

        if (
          !title ||
          (normUrl && existingUrlSet.has(normUrl)) ||
          (normTitle && existingTitleSet.has(normTitle))
        ) {
          duplicateCount++;
          continue;
        }

        const rawDesc = cleanHtmlContent(item.description || item.summary || item.subtitle || '');
        const rawContent = cleanHtmlContent(item['content:encoded'] || rawDesc);
        const category = source.category || detectCategory(title, rawContent);
        const country = source.country || detectCountry(title, rawContent);
        const fallbackImg = FALLBACK_IMAGES[category] || DEFAULT_FALLBACK_IMAGE;
        
        let imgUrl = fallbackImg;
        if (item['media:content']?.['@_url']) imgUrl = item['media:content']['@_url'];
        else if (item['media:thumbnail']?.['@_url']) imgUrl = item['media:thumbnail']['@_url'];
        else if (item.enclosure?.['@_url']) imgUrl = item.enclosure['@_url'];

        const summary = rawDesc.length > 20 ? truncateText(rawDesc, 200) : truncateText(rawContent || title, 160);
        const newArt: Article = {
          id: `feed-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          slug: `${slugify(title)}-${Date.now().toString(36)}`,
          summary,
          content: rawContent || summary,
          image: imgUrl,
          imageCaption: `News report: ${title}`,
          source: source.name,
          sourceUrl: link || 'https://globalnewstoday.com',
          category,
          country,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          collectedAt: new Date().toISOString(),
          author: 'GlobalNews Today',
          tags: [category, country, 'Aggregated News'],
          isBreaking: false,
          isFeatured: false,
          readingTimeMinutes: calculateReadingTime(rawContent || summary),
        };

        existingUrlSet.add(normUrl);
        existingTitleSet.add(normTitle);
        existingIdSet.add(newArt.id);
        newArticlesList.push(newArt);
        newCount++;
      }
    } catch (err) {
      failedSources.push(source.name);
    }
  }

  // Prepend newly fetched articles
  storedArticles = [...newArticlesList, ...storedArticles].slice(0, 5000);
  persistArticles();

  collectorStatus = {
    status: failedSources.length === DEFAULT_FEED_SOURCES.length ? 'ERROR' : 'ONLINE',
    lastSync: new Date().toISOString(),
    totalArticles: storedArticles.length,
    newArticlesLastSync: newCount,
    duplicateArticlesPrevented: duplicateCount,
    sourcesCount: DEFAULT_FEED_SOURCES.length,
    activeSources: DEFAULT_FEED_SOURCES.length - failedSources.length,
    failedSources: failedSources.length,
    lastError: failedSources.length > 0 ? `Failed feeds: ${failedSources.join(', ')}` : undefined,
  };

  const result: CollectorSyncResult = {
    success: true,
    message: `Collector completed: ${newCount} new items, ${duplicateCount} duplicates prevented.`,
    fetchedCount,
    newCount,
    duplicateCount,
    failedSources,
    timestamp: new Date().toISOString(),
  };

  res.json({
    success: true,
    result,
    status: collectorStatus,
  });
});

// Dynamic robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/feed/collect

Sitemap: /sitemap.xml
`);
});

// Dynamic sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  const origin = req.protocol + '://' + req.get('host');
  const now = new Date().toISOString();

  const staticUrls = [
    '',
    '/category/us',
    '/category/uk',
    '/category/world',
    '/category/canada',
    '/category/australia',
    '/category/business',
    '/category/technology',
    '/category/ai',
    '/category/science',
    '/category/health',
    '/category/sports',
    '/category/entertainment',
    '/category/trending',
  ];

  const urlEntries = staticUrls.map(path => `
  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');

  const articleEntries = storedArticles.slice(0, 100).map(a => `
  <url>
    <loc>${origin}/news/${a.slug}</loc>
    <lastmod>${a.publishedAt}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
${articleEntries}
</urlset>`;

  res.send(sitemapXml);
});

// -------------------------------------------------------------
// Vite Middleware & Production Serving
// -------------------------------------------------------------
persistArticles();

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GlobalNews Today Server running on port ${PORT}`);
  });
}

startServer();
