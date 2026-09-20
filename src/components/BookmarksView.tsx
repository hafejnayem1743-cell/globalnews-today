import React from 'react';
import { Bookmark, ChevronLeft, Trash2 } from 'lucide-react';
import { Article } from '../types/news';
import { NewsCard } from './NewsCard';

interface BookmarksViewProps {
  articles: Article[];
  onBack: () => void;
  onArticleClick: (slug: string) => void;
  onBookmarkToggle: (id: string) => void;
  bookmarkedIds: string[];
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  articles,
  onBack,
  onArticleClick,
  onBookmarkToggle,
  bookmarkedIds,
}) => {
  const savedArticles = articles.filter((a) => bookmarkedIds.includes(a.id));

  return (
    <div id="bookmarks-view" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Global Feed</span>
        </button>
      </div>

      <div className="pb-6 border-b-2 border-stone-900 dark:border-stone-100 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bookmark className="w-8 h-8 fill-red-700 text-red-700" />
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-black text-stone-900 dark:text-white">
              Saved Reading List
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Articles you have bookmarked for offline or later reading ({savedArticles.length} saved).
            </p>
          </div>
        </div>
      </div>

      {savedArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedArticles.map((art) => (
            <div key={art.id} className="relative group">
              <NewsCard
                article={art}
                variant="standard"
                onArticleClick={onArticleClick}
                isBookmarked={true}
                onBookmarkToggle={onBookmarkToggle}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-4 text-stone-400">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-stone-900 dark:text-white mb-2">
            Your reading list is empty
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto mb-6 leading-relaxed">
            Click the bookmark icon on any headline or report to save stories here for uninterrupted reading anytime.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Explore Breaking Headlines
          </button>
        </div>
      )}
    </div>
  );
};
