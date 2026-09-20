import React from 'react';
import { ArrowLeft, Mail, ShieldCheck, FileText, Info, Rss } from 'lucide-react';

interface StaticPageProps {
  kind: 'about' | 'editorial' | 'corrections' | 'privacy' | 'terms' | 'contact' | 'latest';
  onBack: () => void;
  articles?: any[];
  onArticleClick?: (slug: string) => void;
}

const copy: Record<Exclude<StaticPageProps['kind'], 'latest'>, {title:string; intro:string; body:string[]}> = {
  about: { title: 'About GlobalNews Today', intro: 'News From Around the World', body: ['GlobalNews Today is an English-language international news portal designed to make major developments easier to discover, understand and follow across regions.', 'Our platform can aggregate public RSS feeds and APIs while preserving source attribution. Aggregated items are clearly identified and link back to the original publisher.', 'Our goal is a fast, accessible reading experience across phones, tablets and desktop screens.'] },
  editorial: { title: 'Editorial Standards', intro: 'Accuracy, attribution and transparency guide the platform.', body: ['GlobalNews Today distinguishes aggregated material from original reporting. Source names and original links are retained whenever available.', 'We avoid presenting unverified claims as established facts and aim to correct material errors when they are identified.', 'Automated collection is intended to organize public feed data, not to bypass access controls or anti-bot protections.'] },
  corrections: { title: 'Corrections Policy', intro: 'We take accuracy seriously.', body: ['If you find a material error in an aggregated item, please contact the editorial team with the article URL and a concise description of the issue.', 'Where practical, corrections are reflected in the stored article record or the article is removed from the public index when the underlying feed item is withdrawn.'] },
  privacy: { title: 'Privacy Notice', intro: 'A simple overview of how this website handles information.', body: ['The website may store preferences such as theme settings and saved stories in your browser. These settings are not required to identify you personally.', 'If newsletter or analytics services are connected later, their own privacy terms should be displayed and linked from this page before activation.', 'Third-party advertising or social widgets may set their own cookies according to their respective policies.'] },
  terms: { title: 'Terms of Service', intro: 'Use of GlobalNews Today is subject to these basic terms.', body: ['Content aggregated from third-party publishers remains subject to the rights and terms of those publishers. GlobalNews Today does not claim ownership of third-party reporting.', 'You may read and share article links for lawful purposes. Automated access must respect publisher terms, robots rules and applicable law.', 'Information on this site is provided for general news and informational purposes.'] },
  contact: { title: 'Contact GlobalNews Today', intro: 'For editorial, corrections and partnership enquiries.', body: ['For the production deployment, replace the placeholder contact address below with your verified newsroom address before publishing.', 'Email: editor@globalnewstoday.com'] },
};

export const StaticPage: React.FC<StaticPageProps> = ({ kind, onBack, articles = [], onArticleClick }) => {
  if (kind === 'latest') {
    return <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-400 mb-6 hover:text-red-700"><ArrowLeft className="w-4 h-4"/>Back</button>
      <div className="border-b-2 border-stone-900 dark:border-white pb-4 mb-7"><div className="text-[11px] uppercase tracking-[0.2em] font-bold text-red-700">Live desk</div><h1 className="font-editorial text-3xl sm:text-5xl font-black mt-1">Latest News</h1><p className="text-stone-500 mt-2">The newest stories currently available in the GlobalNews Today index.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{articles.slice(0,30).map((a:any) => <button key={a.id} onClick={() => onArticleClick?.(a.slug)} className="text-left rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 hover:-translate-y-0.5 transition-transform"><img src={a.image} alt="" loading="lazy" className="w-full aspect-[16/9] object-cover"/><div className="p-4"><div className="text-[10px] font-black uppercase tracking-wider text-red-700">{a.category}</div><h2 className="font-editorial font-bold text-lg leading-tight mt-1 line-clamp-3">{a.title}</h2><p className="text-xs text-stone-500 mt-2 line-clamp-2">{a.summary}</p></div></button>)}</div>
    </section>;
  }
  const c = copy[kind];
  return <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-14"><button onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 dark:text-stone-400 mb-8 hover:text-red-700"><ArrowLeft className="w-4 h-4"/>Back</button><div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-10 shadow-sm"><div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 flex items-center justify-center mb-5">{kind==='privacy'?<ShieldCheck/>:kind==='contact'?<Mail/>:kind==='terms'?<FileText/>:kind==='editorial'?<Rss/>:<Info/>}</div><h1 className="font-editorial text-3xl sm:text-5xl font-black tracking-tight">{c.title}</h1><p className="mt-3 text-red-700 font-semibold">{c.intro}</p><div className="mt-8 space-y-5 text-sm sm:text-base leading-7 text-stone-700 dark:text-stone-300">{c.body.map((p,i)=><p key={i}>{p}</p>)}</div></div></section>;
};
