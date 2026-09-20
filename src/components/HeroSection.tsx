import React from 'react';
import { TrendingUp, Flame } from 'lucide-react';
import { Article } from '../types/news';
import { NewsCard } from './NewsCard';

interface HeroSectionProps {
  mainArticle: Article;
  secondaryArticles: Article[];
  trendingArticles: Article[];
  onArticleClick: (slug: string) => void;
  onCategoryClick: (category: string) => void;
  bookmarkedIds: string[];
  onBookmarkToggle: (id: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  mainArticle,
  secondaryArticles,
  trendingArticles,
  onArticleClick,
  onCategoryClick,
  bookmarkedIds,
  onBookmarkToggle,
}) => {
  return (
    <section id="homepage-hero-section" className="mb-10" aria-label="Lead and Featured Stories">
      {/* 1. Main Lead Hero Story */}
      <div className="mb-6">
        <NewsCard
          article={mainArticle}
          variant="hero"
          priority={true}
          onArticleClick={onArticleClick}
          onCategoryClick={onCategoryClick}
          isBookmarked={bookmarkedIds.includes(mainArticle.id)}
          onBookmarkToggle={onBookmarkToggle}
        />
      </div>

      {/* 2. Secondary Stories Grid (Left 2 cols) + Trending Fast-Scan Rail (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Secondary Stories Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {secondaryArticles.slice(0, 2).map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              variant="featured"
              onArticleClick={onArticleClick}
              onCategoryClick={onCategoryClick}
              isBookmarked={bookmarkedIds.includes(article.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          ))}
        </div>

        {/* Trending / Fast-Scan Wire Sidebar */}
        <div className="lg:col-span-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-700 dark:text-red-400" />
                <h3 className="font-editorial font-bold text-base text-stone-900 dark:text-white uppercase tracking-wider text-xs">
                  Trending Worldwide
                </h3>
              </div>
              <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                24h Velocity
              </span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {trendingArticles.slice(0, 5).map((article, idx) => (
                <div
                  key={article.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onArticleClick(article.slug)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onArticleClick(article.slug);
                  }}
                  className="group py-3 flex gap-3.5 items-start cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 px-2 rounded transition-colors"
                >
                  <span className="font-editorial text-2xl font-black text-stone-400 dark:text-stone-500 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors w-6 flex-shrink-0 leading-none pt-0.5">
                    0{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400 mb-0.5 block">
                      {article.category}
                    </span>
                    <h4 className="font-editorial text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-700 dark:group-hover:text-red-400 line-clamp-2 transition-colors leading-snug">
                      {article.title}
                    </h4>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400 mt-1 block">
                      
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-center">
            <button
              type="button"
              onClick={() => onCategoryClick('Trending')}
              className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline inline-flex items-center gap-1"
            >
              View All Trending Stories →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
