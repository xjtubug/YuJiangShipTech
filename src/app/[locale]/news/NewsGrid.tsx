'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, CalendarDays, ArrowRight, Tag } from 'lucide-react';

interface NewsArticle {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  titleJa?: string;
  titleAr?: string;
  excerpt: string | null;
  image: string | null;
  category: string;
  createdAt: string;
}

interface NewsGridProps {
  news: NewsArticle[];
  locale: string;
  categories: string[];
  categoryLabels: Record<string, Record<string, string>>;
}

function getLocalizedTitle(article: NewsArticle, locale: string): string {
  const map: Record<string, string | undefined> = {
    en: article.titleEn,
    zh: article.titleZh,
    ja: article.titleJa,
    ar: article.titleAr,
  };
  return map[locale] || article.titleEn;
}

export default function NewsGrid({ news, locale, categories, categoryLabels }: NewsGridProps) {
  const tc = useTranslations('common');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const allLabel: Record<string, string> = {
    en: 'All',
    zh: '全部',
    ja: 'すべて',
    ar: 'الكل',
  };

  const filtered = activeCategory
    ? news.filter((n) => n.category === activeCategory)
    : news;

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            !activeCategory
              ? 'bg-primary-700 text-white shadow-md'
              : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-200'
          }`}
        >
          {allLabel[locale] || 'All'}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat
                ? 'bg-primary-700 text-white shadow-md'
                : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-200'
            }`}
          >
            {categoryLabels[cat]?.[locale] || cat}
          </button>
        ))}
      </div>

      {/* News Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory || 'all'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filtered.map((article, i) => {
            const date = new Date(article.createdAt).toLocaleDateString(
              locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'ar' ? 'ar-SA' : 'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            );

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card group flex flex-col"
              >
                {/* Image */}
                <div className="h-48 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center overflow-hidden relative">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={getLocalizedTitle(article, locale)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Newspaper className="h-16 w-16 text-primary-200 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 flex items-center gap-1 bg-primary-700/90 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    <Tag className="h-3 w-3" />
                    {categoryLabels[article.category]?.[locale] || article.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {date}
                  </div>
                  <h3 className="font-bold text-primary-800 mb-2 line-clamp-2 group-hover:text-secondary-600 transition-colors">
                    {getLocalizedTitle(article, locale)}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                      {article.excerpt}
                    </p>
                  )}
                  <Link
                    href={`/news/${article.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-600 hover:text-secondary-700 transition-colors mt-auto"
                  >
                    {tc('readMore')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Newspaper className="w-16 h-16 text-primary-200 mx-auto mb-4" />
          <p className="text-primary-500">
            {locale === 'zh' ? '暂无新闻' : locale === 'ja' ? 'ニュースはありません' : locale === 'ar' ? 'لا توجد أخبار' : 'No news articles found'}
          </p>
        </div>
      )}
    </>
  );
}
