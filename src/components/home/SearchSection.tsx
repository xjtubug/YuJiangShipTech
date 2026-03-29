'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';

const POPULAR_TAGS = [
  'Marine Valves',
  'Ship Pumps',
  'Deck Equipment',
  'Navigation Systems',
  'Fire-Fighting',
  'Pipe Fittings',
];

export default function SearchSection() {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleTagClick = (tag: string) => {
    router.push(`/products?search=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-secondary-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.2),transparent_70%)]" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Find the Right Marine Equipment
          </h2>
          <p className="text-slate-300 mb-8">
            {t('searchPlaceholder')}
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="relative mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-14 pr-36 py-5 rounded-xl text-base bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-3 px-6 text-sm"
            >
              {t('search')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          </form>

          {/* Popular tags */}
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-4 py-1.5 rounded-full text-sm border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
