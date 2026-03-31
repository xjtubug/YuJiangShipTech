'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Anchor, ShoppingCart, Search, ArrowRight } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

interface SearchTag {
  nameEn: string;
  nameZh: string;
  slug: string;
}

export default function HeroSection({ searchTags = [] }: { searchTags?: SearchTag[] }) {
  const t = useTranslations('hero');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleTagClick = (tag: SearchTag) => {
    const name = locale === 'zh' ? tag.nameZh : tag.nameEn;
    router.push(`/products?search=${encodeURIComponent(name)}`);
  };

  const stats = [
    { value: t('stat1Value'), label: t('stat1Label') },
    { value: t('stat2Value'), label: t('stat2Label') },
    { value: t('stat3Value'), label: t('stat3Label') },
    { value: t('stat4Value'), label: t('stat4Label') },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient simulating ocean/industrial theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.25),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(245,158,11,0.1),transparent_60%)]" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated wave shapes */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          className="absolute bottom-0 w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80L48 74.7C96 69.3 192 58.7 288 58.7C384 58.7 480 69.3 576 74.7C672 80 768 80 864 74.7C960 69.3 1056 58.7 1152 53.3C1248 48 1344 48 1392 48L1440 48V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V80Z"
            fill="white"
            fillOpacity="0.05"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="container-wide relative z-10 py-32 md:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Title + CTA */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm text-secondary-300">
                <Anchor className="h-4 w-4" />
                ISO 9001 · CE · DNV-GL Certified
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6"
            >
              {t('title')}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-slate-300 max-w-xl mb-10 leading-relaxed"
            >
              {t('subtitle')}
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary text-base px-8 py-4">
                <ShoppingCart className="h-5 w-5 mr-2" />
                {t('cta1')}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg border-2 border-white/30 text-white font-semibold hover:bg-white/10 active:bg-white/20 active:scale-[0.97] transition-all duration-200 text-base"
              >
                {t('cta2')}
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Search Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              {tc('search')}
            </h2>
            <p className="text-slate-300 text-sm mb-6">
              {tc('searchPlaceholder')}
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tc('searchPlaceholder')}
                className="w-full pl-12 pr-28 py-4 rounded-xl text-base bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2.5 px-5 text-sm"
              >
                {tc('search')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            </form>

            {/* Popular tags from real products */}
            {searchTags.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-semibold">
                  {locale === 'zh' ? '热门搜索' : 'Popular Searches'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {searchTags.map((tag) => (
                    <button
                      key={tag.slug}
                      onClick={() => handleTagClick(tag)}
                      className="px-3 py-1.5 rounded-full text-sm border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {locale === 'zh' ? tag.nameZh : tag.nameEn}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.7 }}
          className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.1, duration: 0.5 }}
              className="text-center md:text-left border-l-2 border-accent-500/60 pl-4"
            >
              <div className="text-3xl md:text-4xl font-bold text-white">
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
