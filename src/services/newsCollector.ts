import { Article, CollectorStatus, CollectorSyncResult, FeedSource, NewsCategory, NewsCountry } from '../types/news';
import { DEFAULT_FEED_SOURCES, FALLBACK_IMAGES, DEFAULT_FALLBACK_IMAGE } from '../config/appConfig';
import { slugify, normalizeTitleForDeduplication, calculateReadingTime, truncateText, cleanHtmlContent } from '../utils/formatters';

const STORAGE_ARTICLES_KEY = 'globalnews_collected_articles_v1';
const STORAGE_STATUS_KEY = 'globalnews_collector_status_v1';

// Category keyword mappings for auto-detection
const CATEGORY_KEYWORDS: Record<NewsCategory, string[]> = {
  AI: ['artificial intelligence', 'ai', 'machine learning', 'neural', 'deep learning', 'chatgpt', 'llm', 'generative ai', 'robotics', 'automation'],
  Technology: ['software', 'hardware', 'cybersecurity', 'apple', 'google', 'microsoft', 'linux', 'chips', 'semiconductor', 'gadget', 'app', 'code', 'internet', 'cloud'],
  Science: ['space', 'nasa', 'astronomy', 'quantum', 'physics', 'biology', 'ocean', 'telescope', 'jwst', 'cern', 'planet', 'mars', 'earth', 'fossil'],
  Health: ['medicine', 'medical', 'hospital', 'cancer', 'vaccine', 'who', 'disease', 'fda', 'clinical', 'doctor', 'treatment', 'drug', 'mental health', 'health'],
  Business: ['market', 'stock', 'shares', 'inflation', 'economy', 'central bank', 'fed', 'investor', 'trade', 'gdp', 'profit', 'revenue', 'wall street', 'bank'],
  Sports: ['football', 'soccer', 'tennis', 'olympics', 'cricket', 'rugby', 'nba', 'championship', 'formula 1', 'f1', 'premier league', 'athlete', 'golf'],
  Entertainment: ['film', 'movie', 'actor', 'cinema', 'music', 'album', 'festival', 'oscar', 'tv series', 'hollywood', 'concert', 'celebrity'],
  US: ['washington', 'biden', 'trump', 'senate', 'congress', 'white house', 'pentagon', 'us ', 'california', 'texas', 'florida', 'american'],
  UK: ['london', 'westminster', 'parliament', 'britain', 'british', 'downing street', 'king charles', 'scotland', 'wales', 'england'],
  Canada: ['ottawa', 'trudeau', 'toronto', 'vancouver', 'montreal', 'quebec', 'canadian', 'ontario', 'alberta', 'british columbia'],
  Australia: ['canberra', 'sydney', 'melbourne', 'queensland', 'australian', 'albanese', 'great barrier reef', 'brisbane', 'perth'],
  Politics: ['election', 'vote', 'summit', 'diplomacy', 'ambassador', 'legislation', 'treaty', 'sanctions', 'minister', 'policy'],
  Lifestyle: ['architecture', 'design', 'recipe', 'diet', 'home', 'living', 'wellness', 'culture'],
  Travel: ['flight', 'airline', 'tourism', 'destination', 'hotel', 'resort', 'passport', 'cruise'],
  Weather: ['storm', 'hurricane', 'cyclone', 'flood', 'drought', 'forecast', 'meteorology', 'blizzard', 'heatwave', 'temperature'],
  Trending: ['viral', 'breakthrough', 'record', 'historic', 'milestone', 'popular'],
  World: ['united nations', 'global', 'international', 'europe', 'asia', 'africa', 'treaty'],
};

export class NewsCollectorService {
  private sources: FeedSource[] = [...DEFAULT_FEED_SOURCES];

  /**
   * Intelligently classify news category based on title and content
   */
  public detectCategory(title: string, content: string = ''): NewsCategory {
    const text = `${title} ${content}`.toLowerCase();

    // Priority check for AI first as it is specialized
    for (const kw of CATEGORY_KEYWORDS.AI) {
      if (text.includes(kw)) return 'AI';
    }

    let bestCategory: NewsCategory = 'World';
    let maxMatches = 0;

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [NewsCategory, string[]][]) {
      let matches = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat;
      }
    }

    return bestCategory;
  }

  /**
   * Detect country/region based on content and title
   */
  public detectCountry(title: string, content: string = ''): NewsCountry {
    const text = `${title} ${content}`.toLowerCase();
    if (text.includes('united states') || text.includes('washington') || text.includes('american') || text.includes('u.s.')) {
      return 'United States';
    }
    if (text.includes('united kingdom') || text.includes('britain') || text.includes('british') || text.includes('london') || text.includes('england')) {
      return 'United Kingdom';
    }
    if (text.includes('canada') || text.includes('canadian') || text.includes('ottawa') || text.includes('toronto')) {
      return 'Canada';
    }
    if (text.includes('australia') || text.includes('australian') || text.includes('sydney') || text.includes('canberra')) {
      return 'Australia';
    }
    if (text.includes('new zealand') || text.includes('auckland') || text.includes('wellington')) {
      return 'New Zealand';
    }
    if (text.includes('singapore')) {
      return 'Singapore';
    }
    return 'World';
  }

  /**
   * Compute fingerprint for strict deduplication
   */
  public generateFingerprint(title: string, sourceUrl: string): string {
    const norm = normalizeTitleForDeduplication(title);
    return `${norm}:::${sourceUrl.toLowerCase().trim()}`;
  }

  /**
   * Normalize an incoming raw article object and enforce defaults
   */
  public normalizeArticle(raw: Partial<Article>): Article | null {
    if (!raw.title || raw.title.trim().length < 5) {
      return null;
    }

    const cleanTitle = cleanHtmlContent(raw.title).trim();
    const cleanContent = raw.content ? cleanHtmlContent(raw.content).trim() : '';
    
    // Generate safe fallback summary if missing
    let summary = raw.summary ? cleanHtmlContent(raw.summary).trim() : '';
    if (!summary || summary.length < 20) {
      summary = truncateText(cleanContent || cleanTitle, 160);
    } else {
      summary = truncateText(summary, 220);
    }

    const category = raw.category || this.detectCategory(cleanTitle, cleanContent);
    const country = raw.country || this.detectCountry(cleanTitle, cleanContent);
    const fallbackImage = FALLBACK_IMAGES[category] || DEFAULT_FALLBACK_IMAGE;
    const image = raw.image && raw.image.startsWith('http') ? raw.image : fallbackImage;
    const slug = raw.slug || `${slugify(cleanTitle)}-${Date.now().toString(36)}`;
    const source = raw.source ? raw.source.trim() : 'International Wire';
    const sourceUrl = raw.sourceUrl ? raw.sourceUrl.trim() : 'https://globalnewstoday.com';

    const nowIso = new Date().toISOString();
    const publishedAt = raw.publishedAt && !isNaN(new Date(raw.publishedAt).getTime())
      ? new Date(raw.publishedAt).toISOString()
      : nowIso;

    return {
      id: raw.id || `art-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: cleanTitle,
      slug,
      summary,
      content: cleanContent || summary,
      image,
      imageCaption: raw.imageCaption || `Editorial photograph accompanying ${cleanTitle}`,
      source,
      sourceUrl,
      category,
      country,
      publishedAt,
      collectedAt: raw.collectedAt || nowIso,
      author: raw.author ? raw.author.trim() : `${source} International Staff`,
      tags: raw.tags && raw.tags.length > 0 ? raw.tags : [category, country, 'Global News'],
      isBreaking: !!raw.isBreaking,
      isFeatured: !!raw.isFeatured,
      readingTimeMinutes: calculateReadingTime(cleanContent || summary),
    };
  }

  /**
   * Parse RSS XML string into raw article objects
   */
  public parseRssXml(xmlText: string, sourceName: string, defaultCategory: NewsCategory, defaultCountry: NewsCountry): Partial<Article>[] {
    const items: Partial<Article>[] = [];

    try {
      // Robust regex-based XML item extractor suitable for both browser & node
      const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
      let match: RegExpExecArray | null;

      while ((match = itemRegex.exec(xmlText)) !== null) {
        const itemContent = match[1];

        // Extract title
        const titleMatch = itemContent.match(/<title(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const title = titleMatch ? cleanHtmlContent(titleMatch[1]) : '';

        // Extract link/guid
        const linkMatch = itemContent.match(/<link(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
        const guidMatch = itemContent.match(/<guid(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);
        const sourceUrl = linkMatch ? linkMatch[1].trim() : (guidMatch ? guidMatch[1].trim() : '');

        // Extract description/summary
        const descMatch = itemContent.match(/<description(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
        const summary = descMatch ? cleanHtmlContent(descMatch[1]) : '';

        // Extract full content
        const contentMatch = itemContent.match(/<(?:content:encoded|body)(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:content:encoded|body)>/i);
        const content = contentMatch ? cleanHtmlContent(contentMatch[1]) : summary;

        // Extract publication date
        const pubDateMatch = itemContent.match(/<pubDate(?:\s[^>]*)?>([\s\S]*?)<\/pubDate>/i);
        const publishedAt = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

        // Extract image (media:content, media:thumbnail, or enclosure)
        const mediaMatch = itemContent.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i)
          || itemContent.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']+["']/i);
        const image = mediaMatch ? mediaMatch[1] : '';

        if (title && sourceUrl) {
          items.push({
            title,
            slug: slugify(title),
            summary,
            content: content || summary,
            image,
            source: sourceName,
            sourceUrl,
            category: defaultCategory,
            country: defaultCountry,
            publishedAt,
          });
        }
      }
    } catch (err) {
      console.warn(`Error parsing RSS for ${sourceName}:`, err);
    }

    return items;
  }

  /**
   * Fetch a single feed with timeout
   */
  public async fetchFeed(source: FeedSource): Promise<Partial<Article>[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'User-Agent': 'GlobalNewsToday-Collector/1.0',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      return this.parseRssXml(xmlText, source.name, source.category, source.country);
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  /**
   * Run collection cycle against configured feed sources
   */
  public async runSync(existingArticles: Article[]): Promise<{
    updatedArticles: Article[];
    result: CollectorSyncResult;
    status: CollectorStatus;
  }> {
    const existingUrlSet = new Set(existingArticles.map(a => a.sourceUrl.toLowerCase().trim()));
    const existingTitleSet = new Set(existingArticles.map(a => normalizeTitleForDeduplication(a.title)));
    const existingIdSet = new Set(existingArticles.map(a => a.id));

    let fetchedCount = 0;
    let newCount = 0;
    let duplicateCount = 0;
    const failedSources: string[] = [];
    const newArticlesList: Article[] = [];

    for (const source of this.sources) {
      if (!source.enabled) continue;

      try {
        const rawItems = await this.fetchFeed(source);
        source.lastChecked = new Date().toISOString();
        source.status = 'active';
        source.errorCount = 0;

        for (const raw of rawItems) {
          fetchedCount++;
          const normTitle = raw.title ? normalizeTitleForDeduplication(raw.title) : '';
          const normUrl = raw.sourceUrl ? raw.sourceUrl.toLowerCase().trim() : '';

          // Deduplication verification
          if (
            (normUrl && existingUrlSet.has(normUrl)) ||
            (normTitle && existingTitleSet.has(normTitle)) ||
            (raw.id && existingIdSet.has(raw.id))
          ) {
            duplicateCount++;
            continue;
          }

          const normalized = this.normalizeArticle(raw);
          if (normalized) {
            existingUrlSet.add(normalized.sourceUrl.toLowerCase().trim());
            existingTitleSet.add(normalizeTitleForDeduplication(normalized.title));
            existingIdSet.add(normalized.id);
            newArticlesList.push(normalized);
            newCount++;
          }
        }
      } catch (error) {
        console.warn(`Feed source failed [${source.name}]:`, error);
        source.status = 'failed';
        source.errorCount = (source.errorCount || 0) + 1;
        failedSources.push(source.name);
      }
    }

    // Combine newly collected articles at the top of the feed
    const combinedArticles = [...newArticlesList, ...existingArticles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const status: CollectorStatus = {
      status: failedSources.length === this.sources.length ? 'ERROR' : 'ONLINE',
      lastSync: new Date().toISOString(),
      totalArticles: combinedArticles.length,
      newArticlesLastSync: newCount,
      duplicateArticlesPrevented: duplicateCount,
      sourcesCount: this.sources.length,
      activeSources: this.sources.length - failedSources.length,
      failedSources: failedSources.length,
      lastError: failedSources.length > 0 ? `Failed sources: ${failedSources.join(', ')}` : undefined,
    };

    const result: CollectorSyncResult = {
      success: true,
      message: `Collector completed with ${newCount} new articles added and ${duplicateCount} duplicates prevented.`,
      fetchedCount,
      newCount,
      duplicateCount,
      failedSources,
      timestamp: new Date().toISOString(),
    };

    return {
      updatedArticles: combinedArticles,
      result,
      status,
    };
  }

  public getSources(): FeedSource[] {
    return [...this.sources];
  }
}

export const newsCollector = new NewsCollectorService();
