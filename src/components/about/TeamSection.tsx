'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const teamMembers = [
  {
    name: 'Zhang Wei',
    title: 'CEO & Founder',
    description: 'Over 25 years of experience in the maritime industry. Leading YuJiang\'s global expansion strategy.',
    color: 'bg-primary-700',
  },
  {
    name: 'Li Ming',
    title: 'CTO',
    description: 'Expert in marine engineering with 15+ years developing innovative equipment solutions.',
    color: 'bg-secondary-600',
  },
  {
    name: 'Wang Fang',
    title: 'Sales Director',
    description: 'Managing international sales across 60+ countries with deep industry relationships.',
    color: 'bg-accent-600',
  },
  {
    name: 'Chen Yu',
    title: 'QC Manager',
    description: 'Ensuring every product meets ISO, CE, and DNV-GL standards before delivery.',
    color: 'bg-marine-500',
  },
];

export default function TeamSection() {
  const t = useTranslations('about');

  return (
    <section className="section-padding bg-white">
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
            {t('team')}
          </span>
          <h2 className="heading-2 mb-4">{t('team')}</h2>
          <p className="text-lg text-primary-500 max-w-2xl mx-auto">
            {t('teamDesc')}
          </p>
        </motion.div>

        {/* Team Grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {teamMembers.map((member) => (
            <motion.div
              key={member.name}
              variants={fadeUp}
              className="card p-6 text-center group"
            >
              {/* Avatar Placeholder */}
              <div
                className={`w-24 h-24 rounded-full ${member.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300`}
              >
                <User className="w-10 h-10 text-white" />
              </div>

              <h4 className="font-bold text-primary-800 text-lg mb-1">
                {member.name}
              </h4>
              <p className="text-secondary-600 text-sm font-semibold mb-3">
                {member.title}
              </p>
              <p className="text-primary-500 text-sm leading-relaxed">
                {member.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
