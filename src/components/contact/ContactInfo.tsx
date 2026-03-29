'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const contactItems = [
  { key: 'address', icon: MapPin, valueKey: 'addressValue', color: 'bg-primary-700' },
  { key: 'phone', icon: Phone, value: '+86-574-8600-0000', color: 'bg-secondary-600' },
  { key: 'email', icon: Mail, value: 'sales@yujiangshiptech.com', color: 'bg-accent-600' },
  { key: 'workingHours', icon: Clock, valueKey: 'workingHoursValue', color: 'bg-marine-500' },
] as const;

export default function ContactInfo() {
  const t = useTranslations('contact');

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Contact Cards */}
      {contactItems.map((item) => {
        const Icon = item.icon;
        const displayValue = 'valueKey' in item ? t(item.valueKey) : item.value;

        return (
          <motion.div
            key={item.key}
            variants={fadeUp}
            className="flex items-start gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100"
          >
            <div
              className={`w-11 h-11 rounded-lg ${item.color} text-white flex items-center justify-center flex-shrink-0`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-primary-800 text-sm">
                {t(item.key)}
              </h4>
              <p className="text-primary-600 text-sm mt-0.5">{displayValue}</p>
            </div>
          </motion.div>
        );
      })}

      {/* Map Placeholder */}
      <motion.div variants={fadeUp}>
        <h3 className="font-bold text-primary-800 mb-3">{t('findUs')}</h3>
        <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-primary-200 bg-primary-50 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="w-12 h-12 text-primary-300 mx-auto mb-2" />
            <p className="text-primary-500 font-medium text-sm">Google Maps</p>
            <p className="text-primary-400 text-xs mt-1">
              Ningbo, Zhejiang, China
            </p>
          </div>
        </div>
      </motion.div>

      {/* Social Media Links */}
      <motion.div variants={fadeUp}>
        <h4 className="font-bold text-primary-800 mb-3 text-sm">Follow Us</h4>
        <div className="flex gap-3">
          <a
            href="https://www.linkedin.com/company/yujiang-shiptech"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-lg bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors"
            aria-label="LinkedIn"
          >
            <svg className="w-5 h-5 text-primary-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a
            href="https://www.youtube.com/@yujiang-shiptech"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-lg bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors"
            aria-label="YouTube"
          >
            <svg className="w-5 h-5 text-primary-700" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a
            href="mailto:sales@yujiangshiptech.com"
            className="w-10 h-10 rounded-lg bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors"
            aria-label="Email"
          >
            <Mail className="w-5 h-5 text-primary-700" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
