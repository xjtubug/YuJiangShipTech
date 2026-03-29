'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Newspaper, CalendarDays, ArrowRight } from 'lucide-react';

interface NewsArticle {
  id: string;
  slug: string;
  titleEn: string;
  excerpt: string | null;
  image: string | null;
  createdAt: string;
}

export default function NewsSection({ news }: { news: NewsArticle[] }) {
  const t = useTranslations('news');
  const tc = useTranslations('common');

  if (!news.length) return null;

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-secondary-600 font-semibold text-sm uppercase tracking-wider"
          >
            {t('latestNews')}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-2 mt-2"
          >
            {t('title')}
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article, i) => {
            const date = new Date(article.createdAt).toLocaleDateString(
              'en-US',
              { year: 'numeric', month: 'short', day: 'numeric' }
            );

            return (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card group"
              >
                {/* Image placeholder */}
                <div className="h-44 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center overflow-hidden">
                  <Newspaper className="h-14 w-14 text-primary-200 group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {date}
                  </div>
                  <h3 className="font-bold text-primary-800 mb-2 line-clamp-2 group-hover:text-secondary-600 transition-colors">
                    {article.titleEn}
                  </h3>
                  {article.excerpt && (
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                      {article.excerpt}
                    </p>
                  )}
                  <Link
                    href={`/news/${article.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-600 hover:text-secondary-700 transition-colors"
                  >
                    {tc('readMore')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/news"
            className="btn-outline inline-flex items-center gap-2"
          >
            {tc('viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
