'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  productCount: number;
}

interface ProductFiltersProps {
  categories: Category[];
  locale: string;
  /** From server `searchParams` — avoids `useSearchParams()` hydration / CSR bailout issues */
  initialCategory?: string;
  initialSearch?: string;
  initialSort?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLocalizedField(obj: any, field: string, locale: string): string {
  const key = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
  return obj[key] || obj[`${field}En`] || '';
}

function buildQueryString(
  base: {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  },
  patch: Record<string, string | null>
) {
  const next: Record<string, string> = {};
  if (base.category) next.category = base.category;
  if (base.search) next.search = base.search;
  if (base.sort && base.sort !== 'newest') next.sort = base.sort;
  if (base.minPrice) next.minPrice = base.minPrice;
  if (base.maxPrice) next.maxPrice = base.maxPrice;

  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === '') {
      delete next[k];
    } else {
      next[k] = v;
    }
  }

  const params = new URLSearchParams();
  if (next.category) params.set('category', next.category);
  if (next.search) params.set('search', next.search);
  if (next.sort && next.sort !== 'newest') params.set('sort', next.sort);
  if (next.minPrice) params.set('minPrice', next.minPrice);
  if (next.maxPrice) params.set('maxPrice', next.maxPrice);
  params.delete('page');
  return params.toString();
}

export default function ProductFilters({
  categories,
  locale,
  initialCategory = '',
  initialSearch = '',
  initialSort = 'newest',
  initialMinPrice = '',
  initialMaxPrice = '',
}: ProductFiltersProps) {
  const t = useTranslations('products');
  const currentLocale = useLocale();
  const effectiveLocale = locale || currentLocale;
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(initialMinPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice || '');

  useEffect(() => {
    setMinPrice(initialMinPrice || '');
    setMaxPrice(initialMaxPrice || '');
  }, [initialMinPrice, initialMaxPrice]);

  const activeCategory = initialCategory;
  const activeSort = initialSort || 'newest';
  const activeSearch = initialSearch;

  const hasActiveFilters =
    !!activeCategory ||
    !!activeSearch ||
    activeSort !== 'newest' ||
    !!(initialMinPrice || initialMaxPrice) ||
    !!(minPrice || maxPrice);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const qs = buildQueryString(
        {
          category: initialCategory,
          search: initialSearch,
          sort: initialSort,
          minPrice: initialMinPrice,
          maxPrice: initialMaxPrice,
        },
        patch
      );
      router.push(`${pathname}${qs ? `?${qs}` : ''}`);
    },
    [
      initialCategory,
      initialSearch,
      initialSort,
      initialMinPrice,
      initialMaxPrice,
      router,
      pathname,
    ]
  );

  const handleCategoryClick = (slug: string) => {
    updateParams({ category: slug === activeCategory ? null : slug });
  };

  const handleSortChange = (sort: string) => {
    updateParams({ sort: sort === 'newest' ? null : sort });
  };

  const handlePriceApply = () => {
    updateParams({
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    router.push(pathname);
  };

  const sortOptions = [
    { value: 'newest', label: t('sortNewest') },
    { value: 'price_asc', label: t('sortPriceLow') },
    { value: 'price_desc', label: t('sortPriceHigh') },
    { value: 'popular', label: t('sortPopular') },
  ];

  const filterContent = (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h4 className="text-sm font-semibold text-primary-800 mb-3">{t('sortBy')}</h4>
        <select
          value={activeSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-700 bg-white"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-primary-800 mb-3">{t('category')}</h4>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => updateParams({ category: null })}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
                !activeCategory
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-600 hover:bg-primary-50'
              )}
            >
              <span>{t('allCategories')}</span>
              <span className="text-xs opacity-70">
                {categories.reduce((s, c) => s + c.productCount, 0)}
              </span>
            </button>
          </li>
          {categories.map((cat) => {
            const catName = getLocalizedField(cat, 'name', effectiveLocale);
            return (
              <li key={cat.id}>
                <button
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors',
                    activeCategory === cat.slug
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-600 hover:bg-primary-50'
                  )}
                >
                  <span className="truncate">{catName}</span>
                  <span className="text-xs opacity-70 ml-2">
                    {cat.productCount}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-primary-800 mb-3">{t('priceRange')}</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder={t('minPrice')}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
            min="0"
          />
          <span className="text-primary-400">–</span>
          <input
            type="number"
            placeholder={t('maxPrice')}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
            min="0"
          />
        </div>
        <button
          onClick={handlePriceApply}
          className="mt-2 w-full text-sm font-medium py-2 rounded-lg bg-secondary-600 text-white hover:bg-secondary-700 transition-colors"
        >
          {t('apply')}
        </button>
      </div>

      {/* Active filters / Clear */}
      {hasActiveFilters && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary-500 uppercase tracking-wider">
              Active filters
            </span>
            <button
              onClick={handleClearFilters}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              {t('clearFilters')}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeCategory && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                <Tag className="w-3 h-3" />
                {categories.find((c) => c.slug === activeCategory)?.nameEn || activeCategory}
                <button
                  onClick={() => updateParams({ category: null })}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {activeSearch && (
              <span className="inline-flex items-center gap-1 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                &ldquo;{activeSearch}&rdquo;
                <button
                  onClick={() => updateParams({ search: null })}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 mb-4 bg-white border border-primary-200 rounded-xl text-sm font-medium text-primary-700"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {t('showFilters')}
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-accent-500 rounded-full" />
          )}
        </span>
        {mobileOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden mb-4"
          >
            <div className="p-4 bg-white border border-primary-200 rounded-xl">
              {filterContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-24 p-5 bg-white border border-primary-100 rounded-xl">
        {filterContent}
      </div>
    </>
  );
}
