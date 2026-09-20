import React, { useState } from 'react';
import { Bookmark, Clock, ExternalLink, Globe } from 'lucide-react';
import { Article } from '../types/news';
import { formatRelativeTime, getDisplayViews } from '../utils/formatters';
import { FALLBACK_IMAGES, DEFAULT_FALLBACK_IMAGE } from '../config/appConfig';

interface NewsCardProps {
  article: Article;
  variant?: 'hero' | 'featured' | 'standard' | 'compact' | 'horizontal' | 'minimal';
  onArticleClick: (slug: string) => void;
  onCategoryClick?: (category: string) => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: (id: string) => void;
  priority?: boolean;
}

export const NewsCard: React.FC<NewsCardProps> = ({
  article,
  variant = 'standard',
  onArticleClick,
  onCategoryClick,
  isBookmarked = false,
  onBookmarkToggle,
  priority = false,
}) => {
  const [imgSrc, setImgSrc] = useState(article.image || FALLBACK_IMAGES[article.category] || DEFAULT_FALLBACK_IMAGE);

  const handleImageError = () => {
    const fallback = FALLBACK_IMAGES[article.category] || DEFAULT_FALLBACK_IMAGE;
    if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If click was inside category badge or bookmark, avoid navigating to article
    const target = e.target as HTMLElement;
    if (target.closest('.no-card-nav')) {
      return;
    }
    onArticleClick(article.slug);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onArticleClick(article.slug);
    }
  };

  // Category badge color accents
  const getCategoryClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'us':
      case 'uk':
      case 'canada':
      case 'australia':
        return 'bg-blue-800 text-white';
      case 'business':
        return 'bg-emerald-800 text-white';
      case 'technology':
      case 'ai':
        return 'bg-indigo-800 text-white';
      case 'science':
        return 'bg-teal-800 text-white';
      case 'health':
        return 'bg-cyan-800 text-white';
      case 'sports':
        return 'bg-orange-800 text-white';
      case 'trending':
        return 'bg-amber-700 text-white';
      default:
        return 'bg-red-800 text-white';
    }
  };

  // --- HERO VARIANT ---
  if (variant === 'hero') {
    return (
      <article
        id={`card-hero-${article.id}`}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row"
      >
        <div className="relative w-full md:w-3/5 h-64 sm:h-80 md:h-[420px] overflow-hidden bg-stone-200 dark:bg-stone-800">
          <img
            src={imgSrc}
            alt={article.title}
            onError={handleImageError}
            loading={priority ? 'eager' : 'lazy'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {article.isBreaking && (
            <div className="absolute top-3 left-3 bg-red-700 text-white text-[11px] font-extrabold uppercase px-2.5 py-1 rounded shadow-sm tracking-wider flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
              Breaking
            </div>
          )}
        </div>
        <div className="w-full md:w-2/5 p-5 md:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCategoryClick?.(article.category);
                  }}
                  className={`no-card-nav text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded transition-opacity hover:opacity-90 ${getCategoryClass(article.category)}`}
                >
                  {article.category}
                </button>
                <span className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-1 font-medium">
                  <Globe className="w-3 h-3" />
                  {article.country}
                </span>
              </div>
              {onBookmarkToggle && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle(article.id);
                  }}
                  aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark story'}
                  className="no-card-nav p-1.5 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-red-700 text-red-700' : ''}`} />
                </button>
              )}
            </div>

            <h2 className="font-editorial text-2xl sm:text-3xl font-bold leading-tight text-stone-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors mb-3">
              {article.title}
            </h2>

            <p className="text-stone-700 dark:text-stone-300 text-sm sm:text-base leading-relaxed line-clamp-3 mb-4">
              {article.summary}
            </p>
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(article.publishedAt)}</span><span className="text-stone-500 dark:text-stone-400">{getDisplayViews(article.id)} views</span>
            </div>
            {article.readingTimeMinutes && (
              <span>{article.readingTimeMinutes} min read</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // --- FEATURED VARIANT ---
  if (variant === 'featured') {
    return (
      <article
        id={`card-featured-${article.id}`}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
      >
        <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-stone-200 dark:bg-stone-800">
          <img
            src={imgSrc}
            alt={article.title}
            onError={handleImageError}
            loading={priority ? 'eager' : 'lazy'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-2.5 left-2.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getCategoryClass(article.category)}`}>
              {article.category}
            </span>
          </div>
        </div>
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-2">
              <span className="font-medium">{article.country}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatRelativeTime(article.publishedAt)}</span><span className="text-stone-500 dark:text-stone-400">{getDisplayViews(article.id)} views</span>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-bold leading-snug text-stone-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors mb-2 line-clamp-2">
              {article.title}
            </h3>
            <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3">
              {article.summary}
            </p>
          </div>
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
            <span className="font-medium truncate max-w-[150px]"></span>
            {onBookmarkToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkToggle(article.id);
                }}
                className="no-card-nav p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
                aria-label="Bookmark"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-red-700 text-red-700' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  // --- HORIZONTAL VARIANT ---
  if (variant === 'horizontal') {
    return (
      <article
        id={`card-horiz-${article.id}`}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group cursor-pointer p-3 sm:p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700 transition-all flex gap-3 sm:gap-4 items-center"
      >
        <div className="w-24 h-20 sm:w-28 sm:h-24 rounded overflow-hidden flex-shrink-0 bg-stone-200 dark:bg-stone-800">
          <img
            src={imgSrc}
            alt={article.title}
            onError={handleImageError}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400 mb-1">
            <span className={`font-bold uppercase tracking-wide px-1.5 py-0.2 rounded text-[9px] ${getCategoryClass(article.category)}`}>
              {article.category}
            </span>
            <span>•</span>
            <span>{formatRelativeTime(article.publishedAt)}</span>
          </div>
          <h4 className="font-editorial text-sm sm:text-base font-bold text-stone-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h4>
        </div>
      </article>
    );
  }

  // --- COMPACT VARIANT ---
  if (variant === 'compact') {
    return (
      <article
        id={`card-compact-${article.id}`}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group cursor-pointer py-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0 hover:bg-stone-50 dark:hover:bg-stone-800/40 px-2 rounded transition-colors"
      >
        <div className="flex items-center justify-between text-[11px] text-stone-600 dark:text-stone-400 mb-1">
          <span className="font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide text-[10px]">
            {article.category}
          </span>
          <span>{formatRelativeTime(article.publishedAt)}</span>
        </div>
        <h4 className="font-editorial text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h4>
        <div className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 flex items-center justify-end">
          <span className="text-[10px] text-stone-600 dark:text-stone-400">{article.country}</span>
        </div>
      </article>
    );
  }

  // --- MINIMAL / NUMBERED VARIANT ---
  if (variant === 'minimal') {
    return (
      <article
        id={`card-minimal-${article.id}`}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group cursor-pointer py-2.5 flex items-start gap-3 hover:bg-stone-50 dark:hover:bg-stone-800/40 px-2 rounded transition-colors"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 text-[10px] text-stone-600 dark:text-stone-400 mb-0.5">
            <span className="font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              {article.category}
            </span>
            <span>•</span>
            <span>{formatRelativeTime(article.publishedAt)}</span>
          </div>
          <h4 className="font-editorial text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-2">
            {article.title}
          </h4>
        </div>
      </article>
    );
  }

  // --- STANDARD CARD (DEFAULT) ---
  return (
    <article
      id={`card-standard-${article.id}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full"
    >
      <div className="relative w-full h-44 overflow-hidden bg-stone-200 dark:bg-stone-800">
        <img
          src={imgSrc}
          alt={article.title}
          onError={handleImageError}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute top-2.5 left-2.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCategoryClick?.(article.category);
            }}
            className={`no-card-nav text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm hover:opacity-90 ${getCategoryClass(article.category)}`}
          >
            {article.category}
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 mb-1.5">
            <span className="font-medium text-[11px]">{article.country}</span>
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(article.publishedAt)}
            </span>
          </div>
          <h3 className="font-editorial text-base sm:text-lg font-bold leading-snug text-stone-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors mb-2 line-clamp-2">
            {article.title}
          </h3>
          <p className="text-stone-700 dark:text-stone-300 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3">
            {article.summary}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <span className="font-medium text-[11px] truncate max-w-[130px]">
            
          </span>
          <div className="flex items-center gap-1">
            {onBookmarkToggle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmarkToggle(article.id);
                }}
                className="no-card-nav p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                aria-label="Bookmark article"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-red-700 text-red-700' : ''}`} />
              </button>
            )}
            <span className="p-1 text-stone-500 group-hover:text-red-700 dark:group-hover:text-red-400">
              <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
