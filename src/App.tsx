import React, { useState, useEffect, useCallback } from 'react';
import { Article, NewsCategory, NewsCountry } from './types/news';
import { newsService } from './services/newsService';
import { Header } from './components/Header';
import { BreakingTicker } from './components/BreakingTicker';
import { HeroSection } from './components/HeroSection';
import { CategorySection } from './components/CategorySection';
import { ArticleDetail } from './components/ArticleDetail';
import { CategoryPage } from './components/CategoryPage';
import { BookmarksView } from './components/BookmarksView';
import { SearchModal } from './components/SearchModal';
import { AdSlot } from './components/AdSlot';
import { Footer } from './components/Footer';
import { StaticPage } from './components/StaticPage';
import { AdminPanel } from './components/AdminPanel';
import { Loader2 } from 'lucide-react';

const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');

function uniqueArticles(items: Article[]): Article[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();
  return items.filter((article) => {
    const title = article.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const url = (article.sourceUrl || '').trim().toLowerCase();
    if (seenIds.has(article.id) || (title && seenTitles.has(title)) || (url && seenUrls.has(url))) return false;
    seenIds.add(article.id);
    if (title) seenTitles.add(title);
    if (url) seenUrls.add(url);
    return true;
  });
}

function applySiteSeo(pathname: string, article?: Article | null, category?: NewsCategory | null) {
  const title = article ? `${article.title} | GlobalNews Today` : category ? `${category} News | GlobalNews Today` : 'GlobalNews Today | News From Around the World';
  const description = article?.summary || (category ? `Latest ${category} news, analysis and updates from around the world.` : 'GlobalNews Today delivers international English-language news, business, technology, AI, science, sports and culture.');
  document.title = title;
  const setMeta = (name: string, content: string, attr = 'name') => {
    let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
    el.content = content;
  };
  setMeta('description', description);
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:url', `${SITE_URL}${pathname}`, 'property');
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  if (article?.image) {
    setMeta('og:image', article.image, 'property');
    setMeta('twitter:image', article.image);
  }
}


export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [breakingArticles, setBreakingArticles] = useState<Article[]>([]);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);
  const [remoteSelectedArticle, setRemoteSelectedArticle] = useState<Article | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | null>(null);
  const [isBookmarksView, setIsBookmarksView] = useState<boolean>(false);
  const [selectedEdition, setSelectedEdition] = useState<string>('Global');
  const [staticPage, setStaticPage] = useState<'latest'|'about'|'editorial'|'corrections'|'privacy'|'terms'|'contact'|null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => window.location.pathname === '/admin' || window.location.pathname === '/admin/');

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Bookmarks state (persisted)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('gnt_bookmarked_ids') || '[]');
    } catch {
      return [];
    }
  });

  // Dark mode state (persisted)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gnt_theme_v15');
      if (saved) return saved === 'dark';
      return false;
    } catch {
      return false;
    }
  });

  // Apply dark mode class to HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gnt_theme_v15', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gnt_theme_v15', 'light');
    }
  }, [isDarkMode]);

  // Persist bookmarks
  const handleBookmarkToggle = (id: string) => {
    setBookmarkedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('gnt_bookmarked_ids', JSON.stringify(updated));
      } catch {
        // LocalStorage fallback
      }
      return updated;
    });
  };

  // Load news data
  const loadNewsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [all, breaking] = await Promise.all([
        newsService.getAllArticles(),
        newsService.getBreakingArticles(),
      ]);
      setArticles(uniqueArticles(all));
      setBreakingArticles(uniqueArticles(breaking));
    } catch (err) {
      console.error('Error loading news data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNewsData();
  }, [loadNewsData]);

  // Clean URL routing with hash fallback for older deployments.
  useEffect(() => {
    const syncRoute = () => {
      const path = window.location.pathname.replace(/\/+$/, '') || '/';
      const hash = window.location.hash;
      const route = path !== '/' ? path : (hash.replace(/^#/, '') || '/');
      if (route === '/admin' || route === '/admin/') { setIsAdminRoute(true); setSelectedArticleSlug(null); setSelectedCategory(null); setStaticPage(null); setIsBookmarksView(false); return; }
      setIsAdminRoute(false);
      if (route.startsWith('/news/')) {
        setSelectedArticleSlug(decodeURIComponent(route.replace('/news/', ''))); setSelectedCategory(null); setStaticPage(null); setIsBookmarksView(false);
      } else if (route.startsWith('/category/')) {
        setSelectedCategory(decodeURIComponent(route.replace('/category/', '')) as NewsCategory); setSelectedArticleSlug(null); setStaticPage(null); setIsBookmarksView(false);
      } else if (route === '/bookmarks') {
        setIsBookmarksView(true); setStaticPage(null); setSelectedArticleSlug(null); setSelectedCategory(null);
      } else if (route === '/latest' || route === '/about' || route === '/editorial-standards' || route === '/corrections' || route === '/privacy' || route === '/terms' || route === '/contact') {
        const map:any = {'/latest':'latest','/about':'about','/editorial-standards':'editorial','/corrections':'corrections','/privacy':'privacy','/terms':'terms','/contact':'contact'};
        setStaticPage(map[route]); setSelectedArticleSlug(null); setSelectedCategory(null); setIsBookmarksView(false);
      } else {
        setStaticPage(null); setSelectedArticleSlug(null); setSelectedCategory(null); setIsBookmarksView(false);
      }
    };
    syncRoute(); window.addEventListener('popstate', syncRoute); window.addEventListener('hashchange', syncRoute);
    return () => { window.removeEventListener('popstate', syncRoute); window.removeEventListener('hashchange', syncRoute); };
  }, []);

  // Navigation handlers
  const handleNavigateHome = () => {
    window.history.pushState({}, '', '/');
    setSelectedArticleSlug(null);
    setSelectedCategory(null);
    setStaticPage(null);
    setIsBookmarksView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateArticle = (slug: string) => {
    window.history.pushState({}, '', `/news/${encodeURIComponent(slug)}`);
    setSelectedArticleSlug(slug);
    setSelectedCategory(null);
    setStaticPage(null);
    setIsBookmarksView(false);
  };

  const handleNavigateCategory = (cat: NewsCategory | string) => {
    window.history.pushState({}, '', `/category/${encodeURIComponent(String(cat).toLowerCase())}`);
    setSelectedCategory(cat as NewsCategory);
    setSelectedArticleSlug(null);
    setStaticPage(null);
    setIsBookmarksView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateCountry = (country: NewsCountry) => {
    // When selecting a country from footer, filter or map to relevant regional category
    if (['US', 'UK', 'Canada', 'Australia'].includes(country)) {
      handleNavigateCategory(country as NewsCategory);
    } else {
      handleNavigateCategory('World');
    }
  };

  const handleNavigateBookmarks = () => {
    window.history.pushState({}, '', '/bookmarks');
    setIsBookmarksView(true);
    setSelectedArticleSlug(null);
    setSelectedCategory(null);
    setStaticPage(null);
  };

  const handleNavigateAdmin = () => { window.history.pushState({}, '', '/admin'); setIsAdminRoute(true); setSelectedArticleSlug(null); setSelectedCategory(null); setStaticPage(null); setIsBookmarksView(false); window.scrollTo({top:0}); };

  const handleNavigateStatic = (page: NonNullable<typeof staticPage>) => {
    const path = page === 'latest' ? '/latest' : page === 'editorial' ? '/editorial-standards' : `/${page}`;
    window.history.pushState({}, '', path);
    setStaticPage(page); setSelectedArticleSlug(null); setSelectedCategory(null); setIsBookmarksView(false);
    window.scrollTo({top:0, behavior:'smooth'});
  };

  // Filter articles based on edition if selected
  const activeArticles = selectedEdition === 'Global'
    ? articles
    : articles.filter(
        (a) =>
          a.country.toLowerCase() === selectedEdition.toLowerCase() ||
          a.category.toLowerCase() === selectedEdition.toLowerCase() ||
          a.category === 'World'
      );

  // Groupings for homepage
  const leadArticle = activeArticles[0] || articles[0];
  const secondaryArticles = activeArticles.slice(1, 3);
  const usedHomeIds = new Set([leadArticle?.id, ...secondaryArticles.map(a => a.id)].filter(Boolean) as string[]);
  const trendingArticles = articles.filter((a) => !usedHomeIds.has(a.id) && (a.category === 'Trending' || a.isFeatured)).slice(0, 6);
  trendingArticles.forEach(a => usedHomeIds.add(a.id));
  const uniqueSection = (items: Article[]) => items.filter(a => !usedHomeIds.has(a.id)).slice(0, 8);

  const worldNews = uniqueSection(articles.filter((a) => a.category === 'World'));
  const usNews = uniqueSection(articles.filter((a) => a.category === 'US'));
  const ukNews = uniqueSection(articles.filter((a) => a.category === 'UK'));
  const businessNews = uniqueSection(articles.filter((a) => a.category === 'Business'));
  const techNews = uniqueSection(articles.filter((a) => a.category === 'Technology' || a.category === 'AI'));
  const sportsNews = uniqueSection(articles.filter((a) => a.category === 'Sports'));
  const healthScienceNews = uniqueSection(articles.filter((a) => a.category === 'Health' || a.category === 'Science'));

  useEffect(() => {
    let cancelled = false;
    if (!selectedArticleSlug) { setRemoteSelectedArticle(null); return; }
    const local = articles.find((a) => a.slug === selectedArticleSlug);
    if (local) { setRemoteSelectedArticle(null); return; }
    newsService.getArticleBySlug(selectedArticleSlug).then((a) => { if (!cancelled) setRemoteSelectedArticle(a); });
    return () => { cancelled = true; };
  }, [selectedArticleSlug, articles]);

  const selectedArticle = selectedArticleSlug
    ? (articles.find((a) => a.slug === selectedArticleSlug) || remoteSelectedArticle)
    : null;

  useEffect(() => {
    applySiteSeo(window.location.pathname, selectedArticle, selectedCategory);
  }, [selectedArticle, selectedCategory]);

  if (isAdminRoute) {
    return <AdminPanel isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(v => !v)} onExit={() => { window.history.pushState({}, '', '/'); setIsAdminRoute(false); setSelectedArticleSlug(null); setSelectedCategory(null); setStaticPage(null); setIsBookmarksView(false); window.scrollTo({top:0}); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-red-800 selection:text-white transition-colors">
      {/* 1. Masthead & Navigation Header */}
      <Header
        currentCategory={selectedCategory || undefined}
        onNavigateHome={handleNavigateHome}
        onNavigateCategory={handleNavigateCategory}
        onNavigateCountry={handleNavigateCountry}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigateBookmarks={handleNavigateBookmarks}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        bookmarkedCount={bookmarkedIds.length}
        selectedEdition={selectedEdition}
        onSelectEdition={setSelectedEdition}
      />

      {/* 2. Live Breaking News Ticker */}
      <BreakingTicker
        articles={breakingArticles}
        onArticleClick={handleNavigateArticle}
      />

      {/* Top Advertisement Banner */}
      <div className="no-print">
        <AdSlot type="banner" slotId="top-leaderboard" />
      </div>

      {/* 3. Main Content Area */}
      <main className="flex-1 w-full" id="main-content">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-stone-500">
            <Loader2 className="w-8 h-8 animate-spin text-red-700 mb-3" />
            <span className="font-editorial text-base font-semibold">
              Loading Global Wire Reports...
            </span>
          </div>
        ) : selectedArticle ? (
          /* View 1: Article Detail Page */
          <ArticleDetail
            article={selectedArticle}
            onBack={handleNavigateHome}
            onArticleClick={handleNavigateArticle}
            onCategoryClick={handleNavigateCategory}
            isBookmarked={bookmarkedIds.includes(selectedArticle.id)}
            onBookmarkToggle={handleBookmarkToggle}
            bookmarkedIds={bookmarkedIds}
          />
        ) : selectedCategory ? (
          /* View 2: Category Listing Page */
          <CategoryPage
            category={selectedCategory}
            articles={articles.filter(
              (a) => a.category.toLowerCase() === selectedCategory.toLowerCase()
            )}
            onBack={handleNavigateHome}
            onArticleClick={handleNavigateArticle}
            onCategoryClick={handleNavigateCategory}
            bookmarkedIds={bookmarkedIds}
            onBookmarkToggle={handleBookmarkToggle}
          />
        ) : staticPage ? (
          <StaticPage kind={staticPage} onBack={handleNavigateHome} articles={articles} onArticleClick={handleNavigateArticle} />
        ) : isBookmarksView ? (
          /* View 3: Saved Reading List View */
          <BookmarksView
            articles={articles}
            onBack={handleNavigateHome}
            onArticleClick={handleNavigateArticle}
            onBookmarkToggle={handleBookmarkToggle}
            bookmarkedIds={bookmarkedIds}
          />
        ) : (
          /* View 4: Full Homepage Editorial Layout */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {leadArticle && (
              <HeroSection
                mainArticle={leadArticle}
                secondaryArticles={secondaryArticles}
                trendingArticles={trendingArticles}
                onArticleClick={handleNavigateArticle}
                onCategoryClick={handleNavigateCategory}
                bookmarkedIds={bookmarkedIds}
                onBookmarkToggle={handleBookmarkToggle}
              />
            )}

            {/* World Affairs Section */}
            <CategorySection
              title="World Dispatches & International Relations"
              category="World"
              articles={worldNews}
              layout="lead-plus-grid"
              onArticleClick={handleNavigateArticle}
              onCategoryClick={handleNavigateCategory}
              bookmarkedIds={bookmarkedIds}
              onBookmarkToggle={handleBookmarkToggle}
            />

            {/* Middle In-Feed Ad Banner */}
            <div className="no-print">
              <AdSlot type="banner" slotId="middle-feed" />
            </div>

            {/* US & UK News Dual Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
              <CategorySection
                title="United States"
                category="US"
                articles={usNews}
                layout="grid"
                onArticleClick={handleNavigateArticle}
                onCategoryClick={handleNavigateCategory}
                bookmarkedIds={bookmarkedIds}
                onBookmarkToggle={handleBookmarkToggle}
              />
              <CategorySection
                title="United Kingdom"
                category="UK"
                articles={ukNews}
                layout="grid"
                onArticleClick={handleNavigateArticle}
                onCategoryClick={handleNavigateCategory}
                bookmarkedIds={bookmarkedIds}
                onBookmarkToggle={handleBookmarkToggle}
              />
            </div>

            {/* Business & Global Markets */}
            <CategorySection
              title="Business, Trade & Global Markets"
              category="Business"
              articles={businessNews}
              layout="lead-plus-grid"
              onArticleClick={handleNavigateArticle}
              onCategoryClick={handleNavigateCategory}
              bookmarkedIds={bookmarkedIds}
              onBookmarkToggle={handleBookmarkToggle}
            />

            {/* Technology & Artificial Intelligence */}
            <CategorySection
              title="Technology, Frontier AI & Quantum"
              category="Technology"
              articles={techNews}
              layout="grid"
              onArticleClick={handleNavigateArticle}
              onCategoryClick={handleNavigateCategory}
              bookmarkedIds={bookmarkedIds}
              onBookmarkToggle={handleBookmarkToggle}
            />

            {/* Sports & Global Culture */}
            <CategorySection
              title="International Sports & Athletics"
              category="Sports"
              articles={sportsNews}
              layout="horizontal"
              onArticleClick={handleNavigateArticle}
              onCategoryClick={handleNavigateCategory}
              bookmarkedIds={bookmarkedIds}
              onBookmarkToggle={handleBookmarkToggle}
            />

            {/* Health & Planetary Sciences */}
            <CategorySection
              title="Science, Space & Health Frontiers"
              category="Science"
              articles={healthScienceNews}
              layout="grid"
              onArticleClick={handleNavigateArticle}
              onCategoryClick={handleNavigateCategory}
              bookmarkedIds={bookmarkedIds}
              onBookmarkToggle={handleBookmarkToggle}
            />

          </div>
        )}
      </main>

      {/* 4. Global Site Footer */}
      <Footer
        onNavigateHome={handleNavigateHome}
        onNavigateCategory={handleNavigateCategory}
        onNavigateCountry={handleNavigateCountry}
        onNavigateStatic={handleNavigateStatic}
        onNavigateAdmin={handleNavigateAdmin}
      />

      {/* 5. Search Modal Overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onArticleClick={handleNavigateArticle}
      />

    </div>
  );
}
