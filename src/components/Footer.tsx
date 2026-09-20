import React from 'react';
import { Globe, Shield, ArrowUp } from 'lucide-react';
import { NewsCategory, NewsCountry } from '../types/news';
import { CATEGORIES_CONFIG, COUNTRIES_CONFIG, APP_CONFIG } from '../config/appConfig';

interface FooterProps {
  onNavigateHome: () => void;
  onNavigateCategory: (category: NewsCategory) => void;
  onNavigateCountry: (country: NewsCountry) => void;
  onNavigateStatic: (page: 'about'|'editorial'|'corrections'|'privacy'|'terms'|'contact') => void;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateHome,
  onNavigateCategory,
  onNavigateCountry,
  onNavigateStatic,
  onNavigateAdmin,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="site-footer" className="bg-stone-950 text-stone-300 pt-12 pb-8 border-t-4 border-red-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Masthead in Footer */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-stone-800">
          <div>
            <div
              role="button"
              tabIndex={0}
              onClick={onNavigateHome}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateHome()}
              className="font-masthead text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase cursor-pointer hover:text-red-500 transition-colors inline-block"
            >
              {APP_CONFIG.name}
            </div>
            <p className="text-xs tracking-[0.2em] font-semibold text-stone-400 uppercase mt-1">
              {APP_CONFIG.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
              className="p-2 rounded-lg border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-300 transition-colors"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Multi-Column Links Directory */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-10 border-b border-stone-800 text-xs">
          {/* Col 1: About & Mission */}
          <div className="col-span-2 lg:col-span-2">
            <h4 className="font-editorial text-sm font-bold uppercase tracking-wider text-white mb-3">
              About GlobalNews Today
            </h4>
            <p className="text-stone-400 leading-relaxed pr-6 mb-4">
              GlobalNews Today is an independent international news publication committed to providing accurate, balanced, and rapid reporting on world affairs, economics, science, culture, and governance for English-speaking readers globally.
            </p>
            <div className="flex items-center gap-4 text-stone-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Fact-Checked Wire Aggregation
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                6 Global Editions
              </span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="font-editorial text-sm font-bold uppercase tracking-wider text-white mb-3">
              Editorial Desks
            </h4>
            <ul className="space-y-2 text-stone-400">
              {CATEGORIES_CONFIG.slice(0, 7).map((c) => (
                <li key={c.category}>
                  <button
                    type="button"
                    onClick={() => onNavigateCategory(c.category)}
                    className="hover:text-white transition-colors"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: More Categories */}
          <div>
            <h4 className="font-editorial text-sm font-bold uppercase tracking-wider text-white mb-3">
              Special Coverage
            </h4>
            <ul className="space-y-2 text-stone-400">
              {CATEGORIES_CONFIG.slice(7).map((c) => (
                <li key={c.category}>
                  <button
                    type="button"
                    onClick={() => onNavigateCategory(c.category)}
                    className="hover:text-white transition-colors"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Regional Editions */}
          <div>
            <h4 className="font-editorial text-sm font-bold uppercase tracking-wider text-white mb-3">
              World Regions
            </h4>
            <ul className="space-y-2 text-stone-400">
              {COUNTRIES_CONFIG.map((ctry) => (
                <li key={ctry}>
                  <button
                    type="button"
                    onClick={() => onNavigateCountry(ctry)}
                    className="hover:text-white transition-colors"
                  >
                    {ctry} Edition
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Ethics Disclaimers */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-400">
          <div>
            © {new Date().getFullYear()} GlobalNews Today. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-stone-400">
            <button onClick={() => onNavigateStatic('about')} className="hover:text-white">About</button>
            <button onClick={() => onNavigateStatic('contact')} className="hover:text-white">Contact</button>
            <button onClick={() => onNavigateStatic('editorial')} className="hover:text-white">Editorial Ethics & Guidelines</button>
            <button onClick={() => onNavigateStatic('corrections')} className="hover:text-white">Corrections Policy</button>
            <button onClick={() => onNavigateStatic('privacy')} className="hover:text-white">Privacy Notice</button>
            <button onClick={() => onNavigateStatic('terms')} className="hover:text-white">Terms of Service</button>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-stone-300">
              XML Sitemap
            </a>
            <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-stone-300">
              Robots.txt
            </a>
            <a href="/admin" className="text-stone-500 hover:text-stone-200">Staff Admin</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
