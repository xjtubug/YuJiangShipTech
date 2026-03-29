'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Factory,
  Globe,
  ShieldCheck,
  Zap,
  Wrench,
  Headphones,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Advantage {
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  color: string;
}

const advantages: Advantage[] = [
  {
    icon: Factory,
    titleKey: 'mfgTitle',
    descKey: 'mfgDesc',
    color: 'from-primary-500 to-primary-700',
  },
  {
    icon: Globe,
    titleKey: 'exportTitle',
    descKey: 'exportDesc',
    color: 'from-secondary-500 to-secondary-700',
  },
  {
    icon: ShieldCheck,
    titleKey: 'certTitle',
    descKey: 'certDesc',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    icon: Zap,
    titleKey: 'deliveryTitle',
    descKey: 'deliveryDesc',
    color: 'from-accent-500 to-accent-700',
  },
  {
    icon: Wrench,
    titleKey: 'customTitle',
    descKey: 'customDesc',
    color: 'from-violet-500 to-violet-700',
  },
  {
    icon: Headphones,
    titleKey: 'supportTitle',
    descKey: 'supportDesc',
    color: 'from-rose-500 to-rose-700',
  },
];

export default function AdvantagesSection() {
  const t = useTranslations('advantages');

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        {/* Header */}
        <div className="text-center mb-14">
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

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {advantages.map((adv, i) => {
            const Icon = adv.icon;
            return (
              <motion.div
                key={adv.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="group relative rounded-2xl border border-slate-100 p-8 hover:shadow-xl hover:border-transparent transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${adv.color} text-white shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="h-7 w-7" />
                </div>

                <h3 className="text-lg font-bold text-primary-800 mb-2">
                  {t(adv.titleKey)}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {t(adv.descKey)}
                </p>

                {/* Hover accent bar */}
                <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-secondary-400 to-accent-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
