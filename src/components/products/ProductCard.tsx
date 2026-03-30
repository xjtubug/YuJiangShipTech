'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Star,
  Anchor,
  Compass,
  Gauge,
  ShieldCheck,
  Droplets,
  GitCompareArrows,
} from 'lucide-react';
import { useInquiryStore, useCurrencyStore, useCompareStore } from '@/lib/store';
import { formatPrice, convertFromUsd, cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-utils';
import Image from 'next/image';

interface ProductData {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descEn: string;
  descZh: string;
  descJa: string;
  descAr: string;
  priceUsd: number;
  moq: number;
  leadTimeDays: number;
  specsJson: string;
  featured: boolean;
  images: string;
  category: {
    slug: string;
    nameEn: string;
    nameZh: string;
    nameJa: string;
    nameAr: string;
  };
}

interface ProductCardProps {
  product: ProductData;
  locale: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLocalizedField(obj: any, field: string, locale: string): string {
  const key = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
  return obj[key] || obj[`${field}En`] || '';
}

const CATEGORY_ICONS: Record<string, typeof Package> = {
  valves: Gauge,
  pumps: Droplets,
  deck: Anchor,
  navigation: Compass,
  safety: ShieldCheck,
};

function getCategoryIcon(categorySlug: string) {
  const match = Object.entries(CATEGORY_ICONS).find(([key]) =>
    categorySlug.toLowerCase().includes(key)
  );
  return match ? match[1] : Package;
}

export default function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const currentLocale = useLocale();
  const effectiveLocale = locale || currentLocale;

  const addItem = useInquiryStore((s) => s.addItem);
  const currency = useCurrencyStore((s) => s.currency);
  const { products: compareProducts, addProduct, removeProduct, setProductData } =
    useCompareStore();
  const isCompared = compareProducts.includes(product.id);

  const productName = getLocalizedField(product, 'name', effectiveLocale);
  const categoryName = getLocalizedField(product.category, 'name', effectiveLocale);
  const productImages = (() => {
    try {
      const parsed = JSON.parse(product.images || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const primaryImage = productImages[0] ? getImageUrl(productImages[0]) : null;

  const convertedPrice = convertFromUsd(product.priceUsd, currency);
  const CategoryIcon = getCategoryIcon(product.category.slug);

  const handleAddToInquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      productName: product.nameEn,
      quantity: product.moq || 1,
      unit: 'pcs',
    });
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeProduct(product.id);
    } else {
      addProduct(product.id);
      setProductData(product.id, {
        id: product.id,
        slug: product.slug,
        nameEn: product.nameEn,
        nameZh: product.nameZh,
        nameJa: product.nameJa,
        nameAr: product.nameAr,
        priceUsd: product.priceUsd,
        moq: product.moq,
        leadTimeDays: product.leadTimeDays,
        categoryName: product.category.nameEn,
        specsJson: product.specsJson,
        sku: product.sku,
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="card group relative"
    >
      {/* Compare toggle */}
      <button
        onClick={handleToggleCompare}
        className={cn(
          'absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors',
          isCompared
            ? 'bg-secondary-600 text-white'
            : 'bg-white/80 text-primary-400 hover:bg-white hover:text-secondary-600'
        )}
        title={tc('compare')}
      >
        <GitCompareArrows className="w-4 h-4" />
      </button>

      {/* Product image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <CategoryIcon className="h-16 w-16 text-primary-300 group-hover:scale-110 transition-transform duration-300" />
        )}
        {product.featured && (
          <span className="absolute top-3 left-3 flex items-center gap-1 bg-accent-500 text-white text-xs font-bold px-2 py-1 rounded">
            <Star className="h-3 w-3" />
            Featured
          </span>
        )}
        <span className="absolute bottom-3 left-3 bg-primary-700/80 text-white text-[10px] font-medium px-2 py-0.5 rounded">
          {tc('moq')}: {product.moq} {tc('pcs')}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-xs text-secondary-600 font-medium uppercase tracking-wide mb-1">
          {categoryName}
        </p>
        <h3 className="font-semibold text-primary-800 mb-2 line-clamp-2 group-hover:text-secondary-600 transition-colors min-h-[2.75rem]">
          {productName}
        </h3>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-lg font-bold text-accent-600">
            {formatPrice(convertedPrice, currency)}
          </span>
          {currency !== 'USD' && (
            <span className="text-xs text-primary-400">
              ({formatPrice(product.priceUsd, 'USD')})
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="flex-1 text-center text-sm font-medium py-2 rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
          >
            {t('viewDetails')}
          </Link>
          <button
            onClick={handleAddToInquiry}
            className="flex items-center justify-center gap-1 flex-1 text-sm font-medium py-2 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{tc('addToInquiry')}</span>
            <span className="sm:hidden">Inquiry</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
