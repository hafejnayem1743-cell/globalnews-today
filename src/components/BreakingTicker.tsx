import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Zap } from 'lucide-react';
import { Article } from '../types/news';

interface BreakingTickerProps {
  articles: Article[];
  onArticleClick: (slug: string) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({ articles, onArticleClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance ticker every 5 seconds unless paused
  useEffect(() => {
    if (articles.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [articles.length, isPaused]);

  if (!articles || articles.length === 0) return null;

  const currentArticle = articles[currentIndex] || articles[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(!isPaused);
  };

  return (
    <div
      id="breaking-news-ticker"
      className="bg-stone-900 dark:bg-stone-950 text-white border-y border-red-800/60 transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="bg-red-700 text-white font-extrabold uppercase px-2.5 py-1 rounded text-[10px] tracking-wider flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 fill-amber-300 text-amber-300 animate-pulse" />
            Breaking
          </span>
          <span className="hidden md:inline-block text-stone-300 text-[11px] font-medium">
            Live Wire:
          </span>
        </div>

        {/* Active Headline */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onArticleClick(currentArticle.slug)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onArticleClick(currentArticle.slug);
            }
          }}
          className="flex-1 min-w-0 cursor-pointer group flex items-center gap-2"
        >
          <span className="font-editorial text-xs sm:text-sm font-semibold text-stone-100 group-hover:text-red-400 truncate transition-colors">
            {currentArticle.title}
          </span>
          <span className="hidden lg:inline-block text-[11px] text-stone-300 flex-shrink-0">
            — {currentArticle.source}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 text-stone-300 flex-shrink-0">
          <span className="hidden sm:inline text-[10px] text-stone-300 font-mono mr-1">
            {currentIndex + 1}/{articles.length}
          </span>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous breaking story"
            className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPaused ? 'Resume ticker' : 'Pause ticker'}
            className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next breaking story"
            className="p-1 hover:text-white hover:bg-stone-800 rounded transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
