'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Cog, FlaskConical, Warehouse, ShieldCheck, Play } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const highlights = [
  { icon: Cog, title: 'CNC Machines', desc: 'Advanced CNC machining centers for precision manufacturing' },
  { icon: FlaskConical, title: 'Testing Lab', desc: 'Full-scale testing laboratory for quality assurance' },
  { icon: Warehouse, title: 'Warehouse', desc: '10,000㎡ warehousing for fast order fulfillment' },
  { icon: ShieldCheck, title: 'QC Center', desc: 'Comprehensive quality control & inspection center' },
];

export default function FactorySection() {
  const t = useTranslations('about');

  return (
    <section className="section-padding bg-primary-50">
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold uppercase tracking-wider text-secondary-600 mb-3">
            {t('factory')}
          </span>
          <h2 className="heading-2 mb-4">{t('factory')}</h2>
          <p className="text-lg text-primary-500 max-w-2xl mx-auto">
            {t('factoryDesc')}
          </p>
        </motion.div>

        {/* Image Gallery Placeholders */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid md:grid-cols-3 gap-4 mb-12"
        >
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="aspect-[4/3] rounded-xl bg-gradient-to-br from-primary-100 to-secondary-50 border border-primary-100 flex items-center justify-center"
            >
              <div className="text-center">
                <Warehouse className="w-12 h-12 text-primary-300 mx-auto mb-2" />
                <p className="text-primary-400 text-sm font-medium">
                  Factory Image {i}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 360° Factory Tour */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h3 className="heading-3 text-center mb-6">{t('factoryTour')}</h3>
          <div className="aspect-video max-w-4xl mx-auto rounded-2xl border-2 border-dashed border-primary-200 bg-white flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-3">
                <Play className="w-8 h-8 text-primary-500" />
              </div>
              <p className="text-xl font-semibold text-primary-700">
                360° Virtual Tour
              </p>
              <p className="text-primary-400 text-sm mt-1">
                Interactive factory tour coming soon
              </p>
            </div>
          </div>
        </motion.div>

        {/* Factory Highlights */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="card p-6 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-700 text-white flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-primary-800 mb-2">{item.title}</h4>
                <p className="text-sm text-primary-500">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
