'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Package } from 'lucide-react';
import { useSearchStore } from '@/lib/store';
// utility imports available if needed

interface SearchResult {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  category: { slug: string; nameEn: string; nameZh: string };
  images: string;
  priceUsd: number;
}

export default function SearchOverlay() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const getLocaleName = (result: SearchResult) => {
    const map: Record<string, string> = { en: result.nameEn, zh: result.nameZh, ja: result.nameJa, ar: result.nameAr };
    return map[locale] || result.nameEn;
  };

  const getLocaleCategoryName = (result: SearchResult) => {
    if (locale === 'zh') return result.category?.nameZh || result.category?.nameEn || '';
    return result.category?.nameEn || '';
  };

  const { isOpen, toggle, query, setQuery } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autofocus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setResults([]);
      setQuery('');
    }
  }, [isOpen, setQuery]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, toggle]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? data ?? []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(value), 350);
  };

  const handleResultClick = (result: SearchResult) => {
    toggle();
    router.push(`/products/${result.slug ?? result.id}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-primary-900/80 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) toggle();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-2xl mx-4"
          >
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-14 pr-14 py-5 bg-white rounded-2xl text-lg text-primary-800 placeholder:text-primary-400 focus:outline-none focus:ring-4 focus:ring-accent-500/30 shadow-2xl"
              />
              <button
                onClick={toggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            {(query.trim().length >= 2 || loading) && (
              <div className="mt-3 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12 text-primary-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" />
                    <span>{t('loading')}</span>
                  </div>
                ) : results.length > 0 ? (
                  <ul>
                    {results.map((result) => (
                      <li key={result.id}>
                        <button
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-b-0"
                        >
                          <div className="w-14 h-14 rounded-lg bg-primary-50 flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-primary-800 truncate">
                              {getLocaleName(result)}
                            </p>
                            <p className="text-sm text-primary-400 truncate">
                              {getLocaleCategoryName(result)}
                            </p>
                          </div>
                          {result.priceUsd != null && (
                            <span className="text-sm font-semibold text-accent-600 shrink-0">
                              ${result.priceUsd.toLocaleString()}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="py-12 text-center text-primary-400">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No results found</p>
                  </div>
                )}
              </div>
            )}

            {/* Hint */}
            <p className="mt-3 text-center text-sm text-primary-300/70">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-primary-200 text-xs font-mono">ESC</kbd> to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
