'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Building2, Users, Factory, Globe, CalendarDays } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const metrics = [
  { icon: Users, value: '300+', labelKey: 'employees' },
  { icon: Factory, value: '50,000㎡', labelKey: 'factoryArea' },
  { icon: CalendarDays, value: '20+', labelKey: 'yearsExperience' },
  { icon: Globe, value: '60+', labelKey: 'countriesServed' },
];

const metricLabels: Record<string, string> = {
  employees: 'Employees',
  factoryArea: 'Factory',
  yearsExperience: 'Years',
  countriesServed: 'Countries',
};

export default function CompanyIntro() {
  const t = useTranslations('about');

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Text Content */}
          <motion.div variants={fadeUp}>
            <span className="inline-block text-sm font-semibold uppercase tracking-wider text-secondary-600 mb-3">
              {t('companyIntro')}
            </span>
            <h2 className="heading-2 mb-6">{t('title')}</h2>
            <p className="text-lg text-primary-600 leading-relaxed mb-6">
              {t('companyDesc')}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CalendarDays className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-800">{t('vision')}</h4>
                  <p className="text-primary-500 text-sm">{t('visionDesc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Globe className="w-5 h-5 text-secondary-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary-800">{t('mission')}</h4>
                  <p className="text-primary-500 text-sm">{t('missionDesc')}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Factory Image Placeholder */}
          <motion.div variants={fadeUp}>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 via-secondary-50 to-primary-50 flex items-center justify-center border border-primary-100">
              <div className="text-center">
                <Building2 className="w-20 h-20 text-primary-300 mx-auto mb-4" />
                <p className="text-primary-400 font-medium">YuJiang ShipTechnology</p>
                <p className="text-primary-300 text-sm">Ningbo, China</p>
              </div>
              {/* Decorative badge */}
              <div className="absolute top-4 right-4 bg-accent-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                Est. 2004
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.labelKey}
                variants={fadeUp}
                className="text-center p-6 rounded-xl bg-primary-50 border border-primary-100 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-primary-700 text-white flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold text-primary-800 mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-primary-500 font-medium">
                  {metricLabels[metric.labelKey]}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
