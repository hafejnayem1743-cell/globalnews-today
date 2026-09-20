import React, { useState, useEffect } from 'react';
import {
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Bookmark,
  Globe,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { NewsCategory, NewsCountry } from '../types/news';
import { CATEGORIES_CONFIG, COUNTRIES_CONFIG, APP_CONFIG } from '../config/appConfig';

interface HeaderProps {
  currentCategory?: string;
  onNavigateHome: () => void;
  onNavigateCategory: (category: NewsCategory) => void;
  onNavigateCountry: (country: NewsCountry) => void;
  onOpenSearch: () => void;
  onNavigateBookmarks: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  bookmarkedCount: number;
  selectedEdition: string;
  onSelectEdition: (edition: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onNavigateHome,
  onNavigateCategory,
  onNavigateCountry,
  onOpenSearch,
  onNavigateBookmarks,
  isDarkMode,
  onToggleTheme,
  bookmarkedCount,
  selectedEdition,
  onSelectEdition,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState({ local: '', utc: '' });

  // Update clock every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime({
        local: now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        utc: `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut for search ("/" key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const handleCategoryClick = (cat: NewsCategory) => {
    onNavigateCategory(cat);
    setMobileMenuOpen(false);
  };

  const editions = ['Global', 'US', 'UK', 'Canada', 'Australia'];

  return (
    <header className="w-full bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 transition-colors">
      {/* 1. TOP METADATA BAR (Date, Edition, Saved Stories, Theme Toggle) */}
      <div className="border-b border-stone-100 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-950/60 text-stone-600 dark:text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-2">
          {/* Left: Live Clocks */}
          <div className="flex items-center gap-3">
            <span className="font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{currentTime.local || 'Today'}</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[11px] text-stone-500">
              {currentTime.utc}
            </span>
          </div>

          {/* Center: Regional Edition Switcher */}
          <div className="hidden md:flex items-center gap-1 text-[11px]">
            <Globe className="w-3 h-3 text-stone-500" />
            <span className="text-stone-500 mr-1 font-semibold">Edition:</span>
            {editions.map((ed) => (
              <button
                key={ed}
                type="button"
                onClick={() => onSelectEdition(ed)}
                className={`px-2 py-0.5 rounded transition-colors ${selectedEdition === ed ? 'bg-red-700 text-white font-bold' : 'hover:text-stone-900 dark:hover:text-white'}`}
              >
                {ed}
              </button>
            ))}
          </div>

          {/* Right: Telemetry Status, Bookmarks, and Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateBookmarks}
              title="Saved Stories"
              className="flex items-center gap-1 text-[11px] font-semibold hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved</span>
              {bookmarkedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-700 text-white text-[10px] flex items-center justify-center font-bold">
                  {bookmarkedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1 rounded-md text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN BRAND MASTHEAD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className="p-2 -ml-2 rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Brand Logo & Tagline (Centered) */}
          <div className="flex-1 text-center cursor-pointer" onClick={onNavigateHome}>
            <div className="inline-block group">
              <h1 className="font-masthead text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white uppercase group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                {APP_CONFIG.name}
              </h1>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="h-[1px] w-6 sm:w-12 bg-stone-300 dark:bg-stone-700"></span>
                <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-stone-600 dark:text-stone-400 uppercase">
                  {APP_CONFIG.tagline}
                </p>
                <span className="h-[1px] w-6 sm:w-12 bg-stone-300 dark:bg-stone-700"></span>
              </div>
            </div>
          </div>

          {/* Quick Search Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search stories"
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:border-stone-400 dark:hover:border-stone-600 transition-colors text-xs font-medium"
            >
              <Search className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-stone-200 dark:bg-stone-700 rounded text-stone-600 dark:text-stone-300">
                /
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DESKTOP STICKY CATEGORIES NAV BAR */}
      <nav
        aria-label="Primary Categories"
        className="hidden lg:block border-t border-stone-200 dark:border-stone-800 sticky top-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ul className="flex items-center justify-between text-xs font-bold uppercase tracking-wider py-2.5 overflow-x-auto scrollbar-none">
            <li>
              <button
                type="button"
                onClick={onNavigateHome}
                className={`py-1 px-2.5 rounded transition-colors whitespace-nowrap ${!currentCategory ? 'text-red-700 dark:text-red-400 font-extrabold' : 'text-stone-800 dark:text-stone-200 hover:text-red-700 dark:hover:text-red-400'}`}
              >
                Home
              </button>
            </li>
            <li><button type="button" onClick={() => { window.history.pushState({}, '', '/latest'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="py-1 px-2 rounded whitespace-nowrap text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400">Latest</button></li>
            {CATEGORIES_CONFIG.map((item) => {
              const isActive = currentCategory?.toLowerCase() === item.category.toLowerCase();
              return (
                <li key={item.category}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(item.category)}
                    className={`py-1 px-2 rounded transition-colors whitespace-nowrap ${isActive ? 'text-red-700 dark:text-red-400 font-extrabold border-b-2 border-red-700 dark:border-red-400 pb-0.5' : 'text-stone-700 dark:text-stone-300 hover:text-red-700 dark:hover:text-red-400'}`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* 4. MOBILE DRAWER NAVIGATION MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white dark:bg-stone-900 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto z-10">
            <div>
              {/* Drawer Top */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 mb-4">
                <div>
                  <div className="font-masthead font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
                    {APP_CONFIG.name}
                  </div>
                  <div className="text-[10px] text-stone-500 uppercase tracking-widest">
                    {APP_CONFIG.tagline}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search trigger inside mobile menu */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="w-full mb-5 flex items-center justify-between px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-600 dark:text-stone-300"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-stone-500" />
                  <span>Search all world news...</span>
                </div>
              </button>

              {/* Category Links */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400 px-2 block mb-1">
                  News Categories
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateHome();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${!currentCategory ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold' : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                >
                  Home Edition
                </button>
                <button type="button" onClick={() => { window.history.pushState({}, '', '/latest'); window.dispatchEvent(new PopStateEvent('popstate')); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800">Latest News</button>
                {CATEGORIES_CONFIG.map((item) => {
                  const isActive = currentCategory?.toLowerCase() === item.category.toLowerCase();
                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => handleCategoryClick(item.category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold' : 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Regional Editions */}
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 dark:text-stone-400 px-2 block mb-2">
                  Regional Edition
                </span>
                <div className="grid grid-cols-2 gap-1.5 px-2">
                  {editions.map((ed) => (
                    <button
                      key={ed}
                      type="button"
                      onClick={() => {
                        onSelectEdition(ed);
                        setMobileMenuOpen(false);
                      }}
                      className={`text-xs px-2.5 py-1.5 rounded text-left ${selectedEdition === ed ? 'bg-red-700 text-white font-bold' : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'}`}
                    >
                      {ed}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Footer Area */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 mt-6 text-xs text-stone-500 space-y-2">
              <div className="text-[11px] text-center pt-2">
                © {new Date().getFullYear()} GlobalNews Today.
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
