'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Star, Building2, MapPin, ArrowRight } from 'lucide-react';
import { getCountryFlag } from '@/lib/utils';

interface CaseStudy {
  id: string;
  slug: string;
  titleEn: string;
  clientName: string;
  country: string;
  contentEn: string;
  rating: number;
  image: string | null;
  clientLogo: string | null;
}

export default function CaseStudySection({ cases }: { cases: CaseStudy[] }) {
  const t = useTranslations('cases');
  const tc = useTranslations('common');

  if (!cases.length) return null;

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
            {t('subtitle')}
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

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cases.map((cs, i) => (
            <motion.div
              key={cs.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card group"
            >
              {/* Project image placeholder */}
              <div className="h-48 bg-gradient-to-br from-secondary-100 to-primary-100 flex items-center justify-center relative overflow-hidden">
                <Building2 className="h-16 w-16 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
                {/* Country badge */}
                <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-primary-700">
                  <MapPin className="h-3 w-3" />
                  {getCountryFlag(cs.country)} {cs.country}
                </span>
              </div>

              <div className="p-6">
                {/* Client logo placeholder + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary-400" />
                  </div>
                  <span className="text-sm font-semibold text-primary-700">
                    {cs.clientName}
                  </span>
                </div>

                <h3 className="font-bold text-primary-800 mb-2 line-clamp-2 group-hover:text-secondary-600 transition-colors">
                  {cs.titleEn}
                </h3>

                <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                  {cs.contentEn}
                </p>

                {/* Rating stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`h-4 w-4 ${
                        idx < cs.rating
                          ? 'fill-accent-400 text-accent-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/cases"
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
