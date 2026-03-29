'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ShoppingCart,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useInquiryStore, useCurrencyStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const;

const currencies = ['USD', 'EUR', 'CNY', 'JPY', 'AED'] as const;

export default function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const langRef = useRef<HTMLDivElement>(null);
  const currRef = useRef<HTMLDivElement>(null);

  const inquiryCount = useInquiryStore((s) => s.items.length);
  const { currency, setCurrency } = useCurrencyStore();

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/products', label: t('products') },
    { href: '/about', label: t('about') },
    { href: '/contact', label: t('contact') },
    { href: '/quote', label: t('quote') },
  ];

  useEffect(() => {
    fetch('/api/admin/settings?key=company_logo')
      .then(res => res.json())
      .then(data => {
        if (data.value) setLogoUrl(data.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (currRef.current && !currRef.current.contains(e.target as Node)) {
        setCurrOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const switchLocale = useCallback(
    (locale: string) => {
      router.replace(pathname, { locale });
      setLangOpen(false);
      setMobileOpen(false);
    },
    [router, pathname],
  );

  const [currentLang, setCurrentLang] = useState<(typeof languages)[number]>(languages[0]);

  useEffect(() => {
    const match = languages.find((l) =>
      window.location.pathname.startsWith(`/${l.code}`),
    );
    if (match) setCurrentLang(match);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300',
          scrolled
            ? 'glass-effect shadow-md'
            : 'bg-white/95 backdrop-blur-sm',
        )}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="YuJiang ShipTech" className="h-9 md:h-12 w-auto object-contain" />
              ) : (
                <>
                  <span className="text-2xl md:text-3xl font-extrabold text-accent-500">YuJiang</span>
                  <span className="text-2xl md:text-3xl font-extrabold text-primary-700">ShipTech</span>
                </>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-primary-800 hover:bg-primary-50 hover:text-primary-600',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop actions */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Language switcher */}
              <div ref={langRef} className="relative">
                <button
                  onClick={() => { setLangOpen(!langOpen); setCurrOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-primary-700 hover:bg-primary-50 transition-colors"
                  aria-label="Switch language"
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLang.flag}</span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', langOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => switchLocale(lang.code)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-primary-800 hover:bg-primary-50 transition-colors"
                        >
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Currency switcher */}
              <div ref={currRef} className="relative">
                <button
                  onClick={() => { setCurrOpen(!currOpen); setLangOpen(false); }}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
                  aria-label="Switch currency"
                >
                  <span>{currency}</span>
                  <ChevronDown className={cn('w-3 h-3 transition-transform', currOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {currOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-1 w-28 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                      {currencies.map((c) => (
                        <button
                          key={c}
                          onClick={() => { setCurrency(c); setCurrOpen(false); }}
                          className={cn(
                            'w-full px-4 py-2.5 text-sm text-left transition-colors',
                            currency === c
                              ? 'bg-primary-50 text-primary-700 font-semibold'
                              : 'text-primary-800 hover:bg-primary-50',
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Inquiry cart */}
              <Link
                href="/quote"
                className="relative p-2 rounded-lg text-primary-700 hover:bg-primary-50 transition-colors"
                aria-label="Inquiry cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {inquiryCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-bold"
                  >
                    {inquiryCount}
                  </motion.span>
                )}
              </Link>
            </div>

            {/* Mobile: cart + hamburger */}
            <div className="flex lg:hidden items-center gap-1">
              <Link
                href="/quote"
                className="relative p-2 rounded-lg text-primary-700"
                aria-label="Inquiry cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {inquiryCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-accent-500 text-white text-[10px] font-bold">
                    {inquiryCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 rounded-lg text-primary-700"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-16 md:h-20" />

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <Link
                  href="/"
                  className="flex items-center gap-2 shrink-0"
                  onClick={() => setMobileOpen(false)}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="YuJiang ShipTech" className="h-8 w-auto object-contain" />
                  ) : (
                    <>
                      <span className="text-xl font-extrabold text-accent-500">YuJiang</span>
                      <span className="text-xl font-extrabold text-primary-700">ShipTech</span>
                    </>
                  )}
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-primary-700 hover:bg-primary-50"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-primary-800 hover:bg-primary-50',
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Language */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Language
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLocale(lang.code)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-primary-800 hover:bg-primary-50 transition-colors border border-gray-100"
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="px-4 pt-4 pb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Currency
                </p>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCurrency(c); setMobileOpen(false); }}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm border transition-colors',
                        currency === c
                          ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                          : 'border-gray-100 text-primary-800 hover:bg-primary-50',
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
