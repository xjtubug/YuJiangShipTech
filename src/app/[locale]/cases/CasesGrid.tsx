'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Star,
  ArrowRight,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

interface CaseStudy {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  clientName: string;
  clientLogo: string | null;
  country: string;
  image: string | null;
  contentEn: string;
  contentZh: string;
  rating: number;
  createdAt: string;
}

interface Props {
  cases: CaseStudy[];
  locale: string;
}

const countryFlags: Record<string, string> = {
  China: '🇨🇳',
  'South Korea': '🇰🇷',
  Italy: '🇮🇹',
  Singapore: '🇸🇬',
  Japan: '🇯🇵',
  Norway: '🇳🇴',
  USA: '🇺🇸',
  Germany: '🇩🇪',
  Greece: '🇬🇷',
  UK: '🇬🇧',
};

export default function CasesGrid({ cases, locale }: Props) {
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  const countries = Array.from(new Set(cases.map((c) => c.country)));
  const filtered = activeCountry
    ? cases.filter((c) => c.country === activeCountry)
    : cases;

  const allLabel: Record<string, string> = {
    en: 'All Regions',
    zh: '全部地区',
    ja: 'すべての地域',
    ar: 'جميع المناطق',
  };

  const projectLabel: Record<string, string> = {
    en: 'Project Details',
    zh: '项目详情',
    ja: 'プロジェクト詳細',
    ar: 'تفاصيل المشروع',
  };

  return (
    <>
      {/* Region Filter */}
      <div className="flex flex-wrap gap-2 mb-10 justify-center">
        <button
          onClick={() => setActiveCountry(null)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            !activeCountry
              ? 'bg-primary-700 text-white shadow-md'
              : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-200'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {allLabel[locale] || allLabel.en}
        </button>
        {countries.map((country) => (
          <button
            key={country}
            onClick={() => setActiveCountry(country)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCountry === country
                ? 'bg-primary-700 text-white shadow-md'
                : 'bg-white text-primary-700 hover:bg-primary-50 border border-primary-200'
            }`}
          >
            <span>{countryFlags[country] || '🌍'}</span>
            {country}
          </button>
        ))}
      </div>

      {/* Cases Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCountry || 'all'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filtered.map((cs, i) => {
            const title = locale === 'zh' ? cs.titleZh : cs.titleEn;
            const content = locale === 'zh' ? cs.contentZh : cs.contentEn;

            return (
              <motion.div
                key={cs.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card group flex flex-col overflow-hidden"
              >
                {/* Project Image */}
                <div className="h-52 bg-gradient-to-br from-secondary-100 to-primary-100 flex items-center justify-center relative overflow-hidden">
                  {cs.image ? (
                    <Image
                      src={cs.image}
                      alt={title}
                      width={800}
                      height={350}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Building2 className="h-20 w-20 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {/* Country badge */}
                  <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1.5 rounded-full text-primary-700 shadow-sm">
                    <MapPin className="h-3 w-3" />
                    {countryFlags[cs.country] || '🌍'} {cs.country}
                  </span>
                  {/* Rating badge */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-3 w-3 ${
                          idx < cs.rating
                            ? 'fill-accent-400 text-accent-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Client */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      {cs.clientLogo ? (
                        <Image
                          src={cs.clientLogo}
                          alt={cs.clientName}
                          width={24}
                          height={24}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary-400" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary-700">
                      {cs.clientName}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-primary-800 mb-2 line-clamp-2 group-hover:text-secondary-600 transition-colors">
                    {title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                    {content}
                  </p>

                  <Link
                    href={`/cases/${cs.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-secondary-600 hover:text-secondary-700 transition-colors mt-auto"
                  >
                    {projectLabel[locale] || projectLabel.en}
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
          <Building2 className="w-16 h-16 text-primary-200 mx-auto mb-4" />
          <p className="text-primary-500">
            {locale === 'zh'
              ? '暂无此地区案例'
              : locale === 'ja'
              ? 'この地域のケーススタディはありません'
              : locale === 'ar'
              ? 'لا توجد دراسات حالة لهذه المنطقة'
              : 'No case studies found for this region'}
          </p>
        </div>
      )}
    </>
  );
}
