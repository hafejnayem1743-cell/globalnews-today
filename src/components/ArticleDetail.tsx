import React, { useState, useEffect } from 'react';
import {
  Clock,
  Globe,
  Share2,
  Bookmark,
  ChevronLeft,
  Check,
  Facebook,
  Twitter,
  Send,
  MessageCircle,
  Type,
  Printer,
  Eye,
} from 'lucide-react';
import { Article } from '../types/news';
import { newsService } from '../services/newsService';
import { formatFullDateTime, formatRelativeTime, getDisplayViews } from '../utils/formatters';
import { AdSlot } from './AdSlot';
import { NewsCard } from './NewsCard';
import { FALLBACK_IMAGES, DEFAULT_FALLBACK_IMAGE } from '../config/appConfig';

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
  onArticleClick: (slug: string) => void;
  onCategoryClick: (category: string) => void;
  isBookmarked: boolean;
  onBookmarkToggle: (id: string) => void;
  bookmarkedIds: string[];
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  onBack,
  onArticleClick,
  onCategoryClick,
  isBookmarked,
  onBookmarkToggle,
  bookmarkedIds,
}) => {
  const [related, setRelated] = useState<Article[]>([]);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState(article.image || FALLBACK_IMAGES[article.category] || DEFAULT_FALLBACK_IMAGE);

  const { local: localTime } = formatFullDateTime(article.publishedAt);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://globalnewstoday.com/news/${article.slug}`;

  // Fetch related stories and dynamically update document title / meta for SEO
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setImgSrc(article.image || FALLBACK_IMAGES[article.category] || DEFAULT_FALLBACK_IMAGE);

    // Dynamic SEO updating
    document.title = `${article.title} - GlobalNews Today`;
    const setMeta = (name:string, content:string, attr='name') => { let el=document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null; if(!el){el=document.createElement('meta');el.setAttribute(attr,name);document.head.appendChild(el);} el.setAttribute('content',content); };
    setMeta('og:title', article.title, 'property');
    setMeta('og:description', article.summary || article.title, 'property');
    setMeta('og:url', currentUrl, 'property');
    setMeta('og:image', article.image || DEFAULT_FALLBACK_IMAGE, 'property');
    setMeta('twitter:title', article.title);
    setMeta('twitter:description', article.summary || article.title);
    setMeta('twitter:image', article.image || DEFAULT_FALLBACK_IMAGE);

    // Inject NewsArticle Schema.org JSON-LD
    const scriptId = 'news-article-schema';
    let existingScript = document.getElementById(scriptId);
    if (!existingScript) {
      existingScript = document.createElement('script');
      existingScript.id = scriptId;
      existingScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(existingScript);
    }
    existingScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.summary,
      image: [article.image || DEFAULT_FALLBACK_IMAGE],
      datePublished: article.publishedAt,
      dateModified: article.publishedAt,
      author: [
        {
          '@type': 'Person',
          name: article.author || 'GlobalNews Today',
        },
      ],
      publisher: {
        '@type': 'Organization',
        name: 'GlobalNews Today',
        url: 'https://globalnewstoday.com',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': currentUrl,
      },
    });

    newsService.getRelatedArticles(article, 4).then(setRelated);

    return () => {
      document.title = 'GlobalNews Today - News From Around the World';
    };
  }, [article, currentUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareData = { title: article.title, text: article.summary || article.title, url: currentUrl };
  const handleNativeShare = async () => {
    try {
      if (navigator.share) { await navigator.share(shareData); }
      else { await handleCopyLink(); }
    } catch { /* cancelled by user */ }
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${article.title} — ${currentUrl}`)}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(article.title)}`, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  // Font size classes
  const getContentFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg sm:text-xl leading-relaxed';
      case 'xlarge':
        return 'text-xl sm:text-2xl leading-relaxed';
      default:
        return 'text-base sm:text-lg leading-relaxed';
    }
  };

  // Paragraph parser
  const paragraphs = article.content
    ? article.content.split('\n\n').filter((p) => p.trim().length > 0)
    : [article.summary];

  return (
    <article id={`article-page-${article.slug}`} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* 1. Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center justify-between text-xs text-stone-500">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => onCategoryClick(article.category)}
            className="font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 hover:underline"
          >
            {article.category}
          </button>
          <span className="hidden sm:inline">/</span>
          <span className="hidden sm:inline truncate max-w-[200px] text-stone-400">
            {article.title}
          </span>
        </div>

        <div className="flex items-center gap-2 no-print">
          {/* Font Size Selector */}
          <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-md p-0.5 bg-stone-100 dark:bg-stone-800 text-xs">
            <button
              type="button"
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-white dark:bg-stone-700 font-bold shadow-xs' : 'text-stone-500'}`}
              title="Standard text size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded ${fontSize === 'large' ? 'bg-white dark:bg-stone-700 font-bold shadow-xs' : 'text-stone-500'}`}
              title="Large text size"
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 rounded ${fontSize === 'xlarge' ? 'bg-white dark:bg-stone-700 font-bold shadow-xs' : 'text-stone-500'}`}
              title="Extra large text size"
            >
              A++
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            aria-label="Print article"
            className="p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* 2. Category & Country Pill */}
      <div className="flex items-center gap-2.5 mb-4">
        <button
          type="button"
          onClick={() => onCategoryClick(article.category)}
          className="bg-red-700 hover:bg-red-800 text-white font-extrabold text-xs uppercase tracking-wider px-3 py-1 rounded"
        >
          {article.category}
        </button>
        <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5" />
          {article.country}
        </span>
        {article.readingTimeMinutes && (
          <span className="text-xs text-stone-500">
            • {article.readingTimeMinutes} min read
          </span>
        )}
      </div>

      {/* 3. Headline (H1) */}
      <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 dark:text-white leading-[1.15] mb-5">
        {article.title}
      </h1>

      {/* 4. Standfirst / Summary Deck */}
      <div className="text-lg sm:text-xl text-stone-700 dark:text-stone-300 font-editorial italic leading-relaxed pb-6 border-b border-stone-200 dark:border-stone-800 mb-6">
        {article.summary}
      </div>

      {/* 5. Publication details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 dark:border-stone-800 mb-6 text-xs text-stone-600 dark:text-stone-400">
        <div>
          <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
            {article.author || 'GlobalNews Today'}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {localTime}
            </span>
            <span>({formatRelativeTime(article.publishedAt)})</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-1"><Eye className="w-3 h-3" />{getDisplayViews(article.id)} views</div>
        </div>
        <div className="text-xs font-semibold text-stone-500">
          {article.country} · {article.category}
        </div>
      </div>

      {/* 6. Social Sharing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 mb-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm no-print">
        <button type="button" onClick={handleNativeShare} className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-200 hover:text-red-700 dark:hover:text-red-400 transition-colors">
          <Share2 className="w-4 h-4" />
          Share Story
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareFacebook}
            aria-label="Share on Facebook"
            className="p-2 rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
          >
            <Facebook className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleShareTwitter}
            aria-label="Share on X / Twitter"
            className="p-2 rounded-full bg-black text-white hover:opacity-90 transition-opacity"
          >
            <Twitter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleShareWhatsApp}
            aria-label="Share on WhatsApp"
            className="p-2 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleShareTelegram}
            aria-label="Share on Telegram"
            className="p-2 rounded-full bg-[#229ED9] text-white hover:opacity-90 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy link to story"
            className="px-3 py-1.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
          </button>
        </div>

        {/* Bookmark Action */}
        <button
          type="button"
          onClick={() => onBookmarkToggle(article.id)}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${isBookmarked ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'}`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-red-700 text-red-700' : ''}`} />
          <span>{isBookmarked ? 'Saved in Reading List' : 'Save Story'}</span>
        </button>
      </div>

      {/* 7. Featured Image & Caption */}
      <figure className="mb-8 overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800">
        <img
          src={imgSrc}
          alt={article.title}
          onError={() => setImgSrc(FALLBACK_IMAGES[article.category] || DEFAULT_FALLBACK_IMAGE)}
          className="w-full h-auto max-h-[520px] object-cover"
        />
        {article.imageCaption && (
          <figcaption className="p-3 text-xs text-stone-600 dark:text-stone-400 italic bg-stone-50 dark:bg-stone-900/40 border-t border-stone-200 dark:border-stone-800">
            {article.imageCaption}
          </figcaption>
        )}
      </figure>

      {/* 8. Article Content Body */}
      <div className={`space-y-6 font-editorial text-stone-800 dark:text-stone-200 ${getContentFontSizeClass()}`}>
        {paragraphs.map((p, idx) => {
          // If first paragraph, add subtle drop cap styling or bold lead
          if (idx === 0) {
            return (
              <p key={idx} className="font-semibold text-stone-900 dark:text-stone-100">
                {p}
              </p>
            );
          }

          // Insert an ad slot after paragraph 2
          if (idx === 2) {
            return (
              <React.Fragment key={idx}>
                <p>{p}</p>
                <div className="no-print">
                  <AdSlot type="native" slotId="in-article-1" />
                </div>
              </React.Fragment>
            );
          }

          if (idx === 6 && paragraphs.length >= 9) {
            return (
              <React.Fragment key={idx}>
                <p>{p}</p>
                <div className="no-print">
                  <AdSlot type="banner" slotId="in-article-2" />
                </div>
              </React.Fragment>
            );
          }

          return <p key={idx}>{p}</p>;
        })}
      </div>

      {/* 9. Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="pt-6 border-t border-stone-200 dark:border-stone-800 mb-8">
          <span className="text-xs uppercase font-bold text-stone-500 tracking-wider block mb-2">
            Related Topics:
          </span>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 12. Related Articles Grid */}
      {related.length > 0 && (
        <section className="pt-8 border-t-2 border-stone-900 dark:border-stone-100 no-print" aria-labelledby="related-heading">
          <h3 id="related-heading" className="font-editorial text-2xl font-bold text-stone-900 dark:text-white mb-6">
            Related International Reports
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {related.map((relArt) => (
              <NewsCard
                key={relArt.id}
                article={relArt}
                variant="standard"
                onArticleClick={onArticleClick}
                onCategoryClick={onCategoryClick}
                isBookmarked={bookmarkedIds.includes(relArt.id)}
                onBookmarkToggle={onBookmarkToggle}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
