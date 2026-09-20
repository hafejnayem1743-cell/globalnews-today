import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Calendar, Globe } from 'lucide-react';
import { Article } from '../types/news';
import { newsService } from '../services/newsService';
import { formatRelativeTime } from '../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleClick: (slug: string) => void;
}

const POPULAR_TOPICS = [
  'Clean Energy',
  'Federal Reserve',
  'Artificial Intelligence',
  'Quantum Computing',
  'Wimbledon',
  'Exoplanets',
  'Geneva Summit',
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onArticleClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(async () => {
      try {
        const found = await newsService.searchArticles(query);
        setResults(found);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="search-modal-container"
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden my-8 sm:my-14"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search breaking stories, global markets, AI, technology..."
            className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg text-stone-900 dark:text-white placeholder-stone-500 font-editorial"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-md transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Suggested Topics when empty */}
        {!query && (
          <div className="p-5">
            <span className="text-xs uppercase font-bold text-stone-600 dark:text-stone-400 tracking-wider mb-2.5 block">
              Trending Search Topics
            </span>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TOPICS.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setQuery(topic)}
                  className="text-xs px-3 py-1.5 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-stone-600 dark:text-stone-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-red-700" />
            <span className="text-xs">Searching global news index...</span>
          </div>
        )}

        {/* Results List */}
        {!isLoading && hasSearched && results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 p-2">
            <div className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 flex justify-between">
              <span>{results.length} Stories Found</span>
              <span>Sorted by Relevance</span>
            </div>
            {results.map((article) => (
              <div
                key={article.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onArticleClick(article.slug);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onArticleClick(article.slug);
                    onClose();
                  }
                }}
                className="group p-3 sm:p-4 flex gap-3 sm:gap-4 items-start hover:bg-stone-50 dark:hover:bg-stone-800/60 rounded-lg cursor-pointer transition-colors"
              >
                {article.image && (
                  <div className="w-20 h-16 sm:w-24 sm:h-20 rounded overflow-hidden flex-shrink-0 bg-stone-200 dark:bg-stone-800">
                    <img
                      src={article.image}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-stone-600 dark:text-stone-400 mb-1">
                    <span className="font-bold text-red-700 dark:text-red-400 uppercase">
                      {article.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      {article.country}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatRelativeTime(article.publishedAt)}
                    </span>
                  </div>
                  <h4 className="font-editorial text-sm sm:text-base font-bold text-stone-900 dark:text-white group-hover:text-red-700 dark:group-hover:text-red-400 line-clamp-2 leading-snug">
                    {article.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-1 mt-1">
                    {article.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-600 dark:text-stone-400">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="font-editorial font-bold text-base text-stone-900 dark:text-white mb-1">
              No matching news stories found
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
              We couldn't find any articles matching "{query}". Try checking for spelling errors or searching for broader terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
