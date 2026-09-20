import React, { useState } from 'react';
import { ChevronLeft, Filter, Globe } from 'lucide-react';
import { Article, NewsCategory, NewsCountry } from '../types/news';
import { CATEGORIES_CONFIG, COUNTRIES_CONFIG } from '../config/appConfig';
import { NewsCard } from './NewsCard';
import { AdSlot } from './AdSlot';

interface CategoryPageProps {
  category: NewsCategory;
  articles: Article[];
  onBack: () => void;
  onArticleClick: (slug: string) => void;
  onCategoryClick: (cat: NewsCategory) => void;
  bookmarkedIds: string[];
  onBookmarkToggle: (id: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  category,
  articles,
  onBack,
  onArticleClick,
  onCategoryClick,
  bookmarkedIds,
  onBookmarkToggle,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [visibleCount, setVisibleCount] = useState<number>(12);

  const categoryMeta = CATEGORIES_CONFIG.find(
    (c) => c.category.toLowerCase() === category.toLowerCase()
  ) || {
    category,
    label: category,
    description: `Latest international news coverage, breaking developments, and in-depth reporting in ${category}.`,
  };

  const filteredArticles = selectedCountry === 'All'
    ? articles
    : articles.filter((a) => a.country.toLowerCase() === selectedCountry.toLowerCase());

  const displayedArticles = filteredArticles.slice(0, visibleCount);

  return (
    <div id={`category-page-${category.toLowerCase()}`} className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Global Feed</span>
        </button>
        <span className="text-xs text-stone-500 font-mono">
          {filteredArticles.length} Stories Available
        </span>
      </div>

      {/* Category Header */}
      <div className="pb-6 border-b-2 border-stone-900 dark:border-stone-100 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-red-700 text-white font-extrabold text-xs uppercase rounded">
            Section
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-black text-stone-900 dark:text-white">
            {categoryMeta.label}
          </h1>
        </div>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          {categoryMeta.description}
        </p>

        {/* Regional Filter Chips */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 flex-shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filter Region:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCountry('All')}
            className={`text-xs px-3 py-1 rounded-full transition-colors flex-shrink-0 ${selectedCountry === 'All' ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'}`}
          >
            All Regions ({articles.length})
          </button>
          {COUNTRIES_CONFIG.map((c) => {
            const count = articles.filter((a) => a.country.toLowerCase() === c.toLowerCase()).length;
            if (count === 0 && selectedCountry !== c) return null;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCountry(c)}
                className={`text-xs px-3 py-1 rounded-full transition-colors flex-shrink-0 flex items-center gap-1 ${selectedCountry === c ? 'bg-red-700 text-white font-bold' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'}`}
              >
                <span>{c}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Grid */}
      {displayedArticles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedArticles.map((art, idx) => (
              <React.Fragment key={art.id}>
                <NewsCard
                  article={art}
                  variant={idx === 0 ? 'featured' : 'standard'}
                  onArticleClick={onArticleClick}
                  onCategoryClick={(cat) => onCategoryClick(cat as NewsCategory)}
                  isBookmarked={bookmarkedIds.includes(art.id)}
                  onBookmarkToggle={onBookmarkToggle}
                />
                {/* Insert AdBanner after 6th card */}
                {idx === 5 && (
                  <div className="col-span-full">
                    <AdSlot type="banner" slotId="category-mid" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Load More Button */}
          {visibleCount < filteredArticles.length && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="px-6 py-3 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm"
              >
                Load More {category} Stories ({filteredArticles.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="font-editorial text-xl font-bold text-stone-900 dark:text-white mb-2">
            No stories available right now.
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-md mx-auto mb-6">
            There are currently no active dispatches filed for {category} in {selectedCountry}. Check back shortly or view other global editions.
          </p>
          <button
            type="button"
            onClick={() => setSelectedCountry('All')}
            className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-lg hover:bg-red-800 transition-colors"
          >
            Reset Region Filters
          </button>
        </div>
      )}
    </div>
  );
};
