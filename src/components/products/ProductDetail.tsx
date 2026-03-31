'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  FileText,
  GitCompareArrows,
  Play,
  Download,
  MessageSquareQuote,
  Clock,
  Boxes,
  ChevronRight,
} from 'lucide-react';
import ShareButtons from '@/components/common/ShareButtons';
import ProductSpecs from './ProductSpecs';
import ProductReviews from './ProductReviews';
import ProductCard from './ProductCard';
import { useInquiryStore, useCurrencyStore, useCompareStore } from '@/lib/store';
import { formatPrice, convertFromUsd, cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-utils';
import { parseProductImages } from '@/lib/parse-product-images';
import ImageLightbox from './ImageLightbox';

interface Review {
  id: string;
  author: string;
  company?: string | null;
  country?: string | null;
  rating: number;
  contentEn: string;
  contentZh: string;
  createdAt: string;
}

interface ExpertReviewData {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  expert: {
    id: string;
    name: string;
    avatar?: string | null;
    bio?: string | null;
    title?: string | null;
  };
}

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
  specsJson: string;
  priceUsd: number;
  moq: number;
  leadTimeDays: number;
  images: string;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  featured: boolean;
  category: {
    slug: string;
    nameEn: string;
    nameZh: string;
    nameJa: string;
    nameAr: string;
  };
  reviews: Review[];
  expertReviews?: ExpertReviewData[];
}

interface RelatedProduct {
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

interface ProductDetailProps {
  product: ProductData;
  relatedProducts: RelatedProduct[];
  locale: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLocalizedField(obj: any, field: string, locale: string): string {
  const key = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
  return obj[key] || obj[`${field}En`] || '';
}

const TABS = ['description', 'specifications', 'videoDemo', 'customerReviews', 'downloadPdf'] as const;
type Tab = (typeof TABS)[number];

/**
 * Extract YouTube video ID from various URL formats and return a clean embed URL.
 * Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 */
function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';

  // Already an embed URL
  if (url.includes('/embed/')) {
    const match = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  // youtu.be short URL
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  // Standard youtube.com/watch?v= URL
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    // Not a valid URL, try regex
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  return url;
}

function getYouTubeThumbnail(url: string): string | null {
  const embedUrl = getYouTubeEmbedUrl(url);
  const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function ProductDetail({
  product,
  relatedProducts,
  locale,
}: ProductDetailProps) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const currentLocale = useLocale();
  const effectiveLocale = locale || currentLocale;

  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const addItem = useInquiryStore((s) => s.addItem);
  const currency = useCurrencyStore((s) => s.currency);
  const { products: compareProducts, addProduct, removeProduct, setProductData } =
    useCompareStore();
  const isCompared = compareProducts.includes(product.id);

  const productName = getLocalizedField(product, 'name', effectiveLocale);
  const productDesc = getLocalizedField(product, 'desc', effectiveLocale);
  const categoryName = getLocalizedField(product.category, 'name', effectiveLocale);
  const convertedPrice = convertFromUsd(product.priceUsd, currency);

  // Parse images array
  const normalizedImages = parseProductImages(product.images)
    .map((image) => getImageUrl(image))
    .filter(Boolean);
  const hasImages = normalizedImages.length > 0;
  const hasVideo = !!product.videoUrl;
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [showingVideo, setShowingVideo] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const videoThumbnail = hasVideo ? getYouTubeThumbnail(product.videoUrl!) : null;

  const [siteUrl, setSiteUrl] = useState<string>('');

  useEffect(() => {
    setSiteUrl(typeof window !== 'undefined' ? window.location.href : '');
  }, []);

  const handleAddToInquiry = () => {
    addItem({
      productId: product.id,
      productName: product.nameEn,
      quantity: product.moq || 1,
      unit: 'pcs',
    });
  };

  const handleToggleCompare = () => {
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
    <div>
      {/* Top section: Image gallery + product info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Main image / video */}
          <div className={cn(
            'bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden',
            showingVideo ? 'aspect-video' : 'aspect-square'
          )}>
            {showingVideo && hasVideo ? (
              <div className="relative w-full h-full">
                <iframe
                  src={getYouTubeEmbedUrl(product.videoUrl!)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={productName}
                />
              </div>
            ) : hasImages && normalizedImages[mainImageIndex] && !failedImages.has(mainImageIndex) ? (
              <button
                onClick={() => openLightbox(mainImageIndex)}
                className="relative w-full h-full cursor-zoom-in"
              >
                <Image
                  src={normalizedImages[mainImageIndex]}
                  alt={productName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  onError={() => setFailedImages((prev) => new Set(prev).add(mainImageIndex))}
                />
              </button>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src="/images/default-product.svg"
                  alt={productName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-8"
                />
              </div>
            )}
          </div>
          {/* Thumbnails */}
          {(hasImages || hasVideo) && (
            <div className="grid grid-cols-4 gap-3">
              {normalizedImages.map((img, i) => (
                <button
                  key={`img-${i}`}
                  onClick={() => { setMainImageIndex(i); setShowingVideo(false); }}
                  className={cn(
                    'aspect-square bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center transition-all overflow-hidden',
                    !showingVideo && mainImageIndex === i
                      ? 'ring-2 ring-secondary-500 ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  {!failedImages.has(i) ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={img}
                        alt={`${productName} ${i + 1}`}
                        fill
                        sizes="120px"
                        className="object-cover rounded-lg"
                        onError={() => setFailedImages((prev) => new Set(prev).add(i))}
                      />
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      <Image
                        src="/images/default-product.svg"
                        alt={`${productName} ${i + 1}`}
                        fill
                        sizes="120px"
                        className="object-contain rounded-lg p-2"
                      />
                    </div>
                  )}
                </button>
              ))}
              {hasVideo && (
                <button
                  onClick={() => setShowingVideo(true)}
                  className={cn(
                    'aspect-square bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg flex items-center justify-center transition-all overflow-hidden relative',
                    showingVideo
                      ? 'ring-2 ring-secondary-500 ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  {videoThumbnail ? (
                    <div className="relative w-full h-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={videoThumbnail}
                        alt={`${productName} video`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-primary-800 rounded-lg" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Product info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          {/* Breadcrumb-like category */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/products"
              className="text-secondary-600 hover:text-secondary-700"
            >
              {t('title')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-primary-300" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="text-secondary-600 hover:text-secondary-700"
            >
              {categoryName}
            </Link>
          </div>

          {/* Name & SKU */}
          <div>
            <h1 className="heading-2 mb-2">{productName}</h1>
            <p className="text-sm text-primary-400">
              {t('sku')}: {product.sku}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-accent-600">
              {formatPrice(convertedPrice, currency)}
            </span>
            {currency !== 'USD' && (
              <span className="text-sm text-primary-400">
                ({formatPrice(product.priceUsd, 'USD')})
              </span>
            )}
          </div>

          {/* MOQ & Lead Time */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
              <Boxes className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-primary-700">
                <span className="font-medium">{tc('moq')}:</span> {product.moq}{' '}
                {tc('pcs')}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-primary-700">
                <span className="font-medium">{tc('leadTime')}:</span>{' '}
                {product.leadTimeDays} {tc('days')}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/contact" className="btn-primary gap-2">
              <FileText className="w-4 h-4" />
              {t('requestQuote')}
            </Link>
            <button onClick={handleAddToInquiry} className="btn-secondary gap-2">
              <ShoppingCart className="w-4 h-4" />
              {tc('addToInquiry')}
            </button>
            <button
              onClick={handleToggleCompare}
              className={cn(
                'btn-outline gap-2',
                isCompared && 'bg-secondary-600 text-white border-secondary-600 hover:bg-secondary-700'
              )}
            >
              <GitCompareArrows className="w-4 h-4" />
              {tc('compare')}
            </button>
          </div>

          {/* Share */}
          <ShareButtons
            url={siteUrl}
            title={productName}
            description={productDesc}
          />
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="border-b border-slate-200">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-secondary-600 text-secondary-700'
                    : 'border-transparent text-primary-400 hover:text-primary-600 hover:border-primary-200'
                )}
              >
                {t(tab)}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {/* Description */}
          {activeTab === 'description' && (
            <motion.div
              key="description"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-primary max-w-none"
            >
              <p className="text-primary-600 leading-relaxed whitespace-pre-line">
                {productDesc}
              </p>
            </motion.div>
          )}

          {/* Specifications */}
          {activeTab === 'specifications' && (
            <motion.div
              key="specs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProductSpecs specsJson={product.specsJson} />
            </motion.div>
          )}

          {/* Video Demo */}
          {activeTab === 'videoDemo' && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {product.videoUrl ? (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={getYouTubeEmbedUrl(product.videoUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={productName}
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-slate-100 flex flex-col items-center justify-center text-primary-400">
                  <Play className="w-16 h-16 mb-3" />
                  <p className="text-sm">{t('videoDemo')}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Reviews */}
          {activeTab === 'customerReviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ProductReviews reviews={product.reviews} slug={product.slug} />
            </motion.div>
          )}

          {/* Download */}
          {activeTab === 'downloadPdf' && (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-8"
            >
              <FileText className="w-16 h-16 text-primary-300 mb-4" />
              <h3 className="text-lg font-semibold text-primary-800 mb-2">
                {t('downloadPdf')}
              </h3>
              <p className="text-sm text-primary-500 mb-6 text-center max-w-md">
                {productName} — Technical Datasheet (PDF)
              </p>
              {product.pdfUrl ? (
                <a
                  href={product.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary gap-2"
                >
                  <Download className="w-4 h-4" />
                  {tc('download')} PDF
                </a>
              ) : (
                <button disabled className="btn-primary gap-2 opacity-50 cursor-not-allowed">
                  <Download className="w-4 h-4" />
                  PDF Not Available
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Expert Reviews */}
      {product.expertReviews && product.expertReviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl border border-primary-100"
        >
          <h3 className="font-semibold text-primary-800 mb-4 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5" />
            {t('expertRecommendation')}
          </h3>
          <div className="space-y-4">
            {product.expertReviews.map((er) => (
              <div key={er.id} className="flex items-start gap-4">
                <div className="relative group flex-shrink-0">
                  {er.expert.avatar ? (
                    <Image
                      src={getImageUrl(er.expert.avatar)}
                      alt={er.expert.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary-200 cursor-pointer"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-primary-700 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
                      {er.expert.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <div className="flex items-center gap-3 mb-2">
                      {er.expert.avatar ? (
                        <Image src={getImageUrl(er.expert.avatar)} alt={er.expert.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {er.expert.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-primary-800 text-sm">{er.expert.name}</p>
                        {er.expert.title && <p className="text-xs text-gray-500">{er.expert.title}</p>}
                      </div>
                    </div>
                    {er.expert.bio && <p className="text-xs text-gray-600 leading-relaxed">{er.expert.bio}</p>}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45"></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-primary-800 text-sm">{er.expert.name}</span>
                    {er.expert.title && <span className="text-xs text-gray-500">· {er.expert.title}</span>}
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < er.rating ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-primary-600 leading-relaxed">{er.content}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No expert reviews - show generic recommendation */}
      {(!product.expertReviews || product.expertReviews.length === 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 p-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl border border-primary-100"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-700 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageSquareQuote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-800 mb-1">
                {t('expertRecommendation')}
              </h3>
              <p className="text-sm text-primary-600 leading-relaxed">
                {t('expertRecommendationDesc')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="heading-2 mb-8">{t('relatedProducts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rp) => (
              <ProductCard
                key={rp.id}
                product={rp}
                locale={effectiveLocale}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxOpen && hasImages && (
          <ImageLightbox
            images={normalizedImages}
            currentIndex={lightboxIndex}
            alt={productName}
            onClose={() => setLightboxOpen(false)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
