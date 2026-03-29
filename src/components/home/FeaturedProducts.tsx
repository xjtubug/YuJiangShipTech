'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, ArrowRight, Star } from 'lucide-react';
import { useInquiryStore, useCurrencyStore } from '@/lib/store';
import { formatPrice, convertFromUsd } from '@/lib/utils';

interface Product {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  priceUsd: number;
  moq: number;
  featured: boolean;
  category: { nameEn: string; nameZh: string; slug: string };
  images: string;
}

export default function FeaturedProducts({ products }: { products: Product[] }) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const locale = useLocale();
  const addItem = useInquiryStore((s) => s.addItem);
  const currency = useCurrencyStore((s) => s.currency);

  const getName = (p: Product) => {
    const map: Record<string, string> = { en: p.nameEn, zh: p.nameZh, ja: p.nameJa, ar: p.nameAr };
    return map[locale] || p.nameEn;
  };

  const getCategoryName = (p: Product) => {
    if (locale === 'zh') return p.category?.nameZh || p.category?.nameEn;
    return p.category?.nameEn;
  };

  const handleAddToInquiry = (product: Product) => {
    addItem({
      productId: product.id,
      productName: getName(product),
      quantity: product.moq || 1,
      unit: 'pcs',
    });
  };

  if (!products.length) return null;

  return (
    <section className="section-padding bg-slate-50">
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
            {t('featured')}
          </motion.h2>
        </div>

        {/* Mobile: horizontal scroll / Desktop: grid */}
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card flex-shrink-0 w-72 md:w-auto snap-start group"
            >
              {/* Image placeholder - clickable */}
              <Link href={`/products/${product.slug}`} className="block">
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
                  <Package className="h-16 w-16 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
                  {product.featured && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded">
                      <Star className="h-3 w-3" />
                      Featured
                    </span>
                  )}
                </div>
              </Link>

              {/* Content */}
              <div className="p-5">
                <p className="text-xs text-secondary-600 font-medium uppercase tracking-wide mb-1">
                  {getCategoryName(product)}
                </p>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-semibold text-primary-800 mb-2 line-clamp-2 group-hover:text-secondary-600 transition-colors cursor-pointer">
                    {getName(product)}
                  </h3>
                </Link>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-lg font-bold text-accent-600">
                    {formatPrice(convertFromUsd(product.priceUsd, currency), currency)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {tc('moq')}: {product.moq} {tc('pcs')}
                </p>

                <div className="flex gap-2">
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex-1 text-center text-sm font-medium py-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
                  >
                    {tc('learnMore')}
                  </Link>
                  <button
                    onClick={() => handleAddToInquiry(product)}
                    className="flex items-center justify-center gap-1 flex-1 text-sm font-medium py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {tc('addToInquiry')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/products"
            className="btn-outline inline-flex items-center gap-2"
          >
            {t('allProducts')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
