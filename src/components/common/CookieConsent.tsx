'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useCookieConsentStore } from '@/lib/store';

const STORAGE_KEY = 'cookie-consent';

export default function CookieConsent() {
  const t = useTranslations('common');
  const { consent, setConsent } = useCookieConsentStore();
  const [mounted, setMounted] = useState(false);

  // Read saved consent from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'accepted' || saved === 'declined') {
      setConsent(saved);
    }
    setMounted(true);
  }, [setConsent]);

  // Load tracking scripts when accepted
  useEffect(() => {
    if (consent === 'accepted' && typeof window !== 'undefined') {
      // Placeholder: load analytics / tracking scripts here
      // e.g. Google Analytics, Facebook Pixel, etc.
    }
  }, [consent]);

  const handleAccept = () => {
    setConsent('accepted');
    localStorage.setItem(STORAGE_KEY, 'accepted');
  };

  const handleDecline = () => {
    setConsent('declined');
    localStorage.setItem(STORAGE_KEY, 'declined');
  };

  // Don't render until mounted or if consent already given
  if (!mounted || consent !== null) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 inset-x-0 z-[90] p-4"
      >
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white rounded-2xl shadow-2xl border border-gray-100 px-6 py-5">
            <Cookie className="w-6 h-6 text-accent-500 shrink-0 hidden sm:block" />

            <p className="flex-1 text-sm text-primary-700 leading-relaxed">
              {t('cookieConsent')}
            </p>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDecline}
                className="px-4 py-2 rounded-lg text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {t('declineCookies')}
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-accent-500 text-white hover:bg-accent-600 transition-colors shadow-sm"
              >
                {t('acceptCookies')}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
