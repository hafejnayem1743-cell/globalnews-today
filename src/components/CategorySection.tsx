import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Article, NewsCategory } from '../types/news';
import { NewsCard } from './NewsCard';

interface CategorySectionProps {
  title: string;
  category: NewsCategory;
  articles: Article[];
  onArticleClick: (slug: string) => void;
  onCategoryClick: (category: string) => void;
  bookmarkedIds: string[];
  onBookmarkToggle: (id: string) => void;
  layout?: 'grid' | 'lead-plus-grid' | 'horizontal';
  accentColor?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  category,
  articles,
  onArticleClick,
  onCategoryClick,
  bookmarkedIds,
  onBookmarkToggle,
  layout = 'lead-plus-grid',
}) => {
  if (!articles || articles.length === 0) {
    return null;
  }

  const [leadArticle, ...supportingArticles] = articles;

  return (
    <section id={`section-${category.toLowerCase()}`} className="my-10" aria-labelledby={`heading-${category.toLowerCase()}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 mb-5 border-b-2 border-stone-900 dark:border-stone-100">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-700"></span>
          <h2 id={`heading-${category.toLowerCase()}`} className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onCategoryClick(category)}
          className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 group transition-colors"
        >
          <span>More {category} News</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Layout: Lead Plus Grid */}
      {layout === 'lead-plus-grid' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Primary Lead Card */}
          <div className="md:col-span-6 lg:col-span-5">
            <NewsCard
              article={leadArticle}
              variant="featured"
              onArticleClick={onArticleClick}
              onCategoryClick={onCategoryClick}
              isBookmarked={bookmarkedIds.includes(leadArticle.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          </div>

          {/* Supporting Grid */}
          <div className="md:col-span-6 lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {supportingArticles.slice(0, 4).map((art) => (
              <NewsCard
                key={art.id}
                article={art}
                variant="standard"
                onArticleClick={onArticleClick}
                onCategoryClick={onCategoryClick}
                isBookmarked={bookmarkedIds.includes(art.id)}
                onBookmarkToggle={onBookmarkToggle}
              />
            ))}
          </div>
        </div>
      )}

      {/* Layout: Grid Only */}
      {layout === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.slice(0, 4).map((art) => (
            <NewsCard
              key={art.id}
              article={art}
              variant="standard"
              onArticleClick={onArticleClick}
              onCategoryClick={onCategoryClick}
              isBookmarked={bookmarkedIds.includes(art.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          ))}
        </div>
      )}

      {/* Layout: Horizontal Cards */}
      {layout === 'horizontal' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.slice(0, 3).map((art) => (
            <NewsCard
              key={art.id}
              article={art}
              variant="horizontal"
              onArticleClick={onArticleClick}
              onCategoryClick={onCategoryClick}
              isBookmarked={bookmarkedIds.includes(art.id)}
              onBookmarkToggle={onBookmarkToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
};
