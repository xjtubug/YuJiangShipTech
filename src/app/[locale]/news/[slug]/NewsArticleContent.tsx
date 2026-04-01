'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  User,
  Tag,
  ArrowLeft,
  ArrowRight,
  Newspaper,
  Share2,
  Link2,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';

interface Article {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  titleJa: string;
  titleAr: string;
  contentEn: string;
  contentZh: string;
  contentJa: string;
  contentAr: string;
  excerpt: string | null;
  image: string | null;
  images: string;
  source: string | null;
  sourceUrl: string | null;
  category: string;
  author: string;
  publishedAt: string;
  createdAt: string;
}

interface RelatedArticle extends Article {
  publishedDateShort?: string;
}

interface Props {
  article: Article;
  locale: string;
  publishedDate: string;
  relatedArticles: RelatedArticle[];
}

function getLocalized<T>(map: Record<string, T>, locale: string, fallback: T): T {
  return map[locale] ?? fallback;
}

export default function NewsArticleContent({ article, locale, relatedArticles, publishedDate }: Props) {
  const tc = useTranslations('common');
  const [carouselIndex, setCarouselIndex] = useState(0);

  const categoryLabels: Record<string, Record<string, string>> = {
    industry: { en: 'Industry News', zh: '行业新闻', ja: '業界ニュース', ar: 'أخبار الصناعة' },
    company: { en: 'Company News', zh: '公司新闻', ja: '企業ニュース', ar: 'أخبار الشركة' },
  };

  let carouselImages: string[] = [];
  try {
    const parsed = JSON.parse(article.images || '[]');
    if (Array.isArray(parsed)) carouselImages = parsed.filter((s: unknown) => typeof s === 'string' && s.length > 0);
  } catch {
    // invalid JSON
  }

  const titleMap: Record<string, string> = {
    en: article.titleEn,
    zh: article.titleZh,
    ja: article.titleJa,
    ar: article.titleAr,
  };
  const contentMap: Record<string, string> = {
    en: article.contentEn,
    zh: article.contentZh,
    ja: article.contentJa,
    ar: article.contentAr,
  };
  const localizedTitle = getLocalized(titleMap, locale, article.titleEn);
  const localizedContent = getLocalized(contentMap, locale, article.contentEn) || article.contentEn;

  // Use server-provided formatted date to avoid hydration mismatches
  // (passed as prop from the parent server component)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = publishedDate || '';

  const backLabel: Record<string, string> = {
    en: 'Back to News',
    zh: '返回新闻列表',
    ja: 'ニュース一覧に戻る',
    ar: 'العودة إلى الأخبار',
  };

  const relatedLabel: Record<string, string> = {
    en: 'Related Articles',
    zh: '相关文章',
    ja: '関連記事',
    ar: 'مقالات ذات صلة',
  };

  const shareLabel: Record<string, string> = {
    en: 'Share This Article',
    zh: '分享这篇文章',
    ja: 'この記事を共有',
    ar: 'شارك هذا المقال',
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Current page URL is only available on the client — initialize as empty to avoid
  // server/client HTML differences and populate in useEffect after hydration.
  const [currentUrl, setCurrentUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') setCurrentUrl(window.location.href);
  }, []);

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {date}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {article.author}
              </span>
              <span className="flex items-center gap-1.5 bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full font-medium">
                <Tag className="h-3.5 w-3.5" />
                {categoryLabels[article.category]?.[locale] || article.category}
              </span>
            </div>

            {/* Image / Carousel */}
            {carouselImages.length > 1 ? (
              <div className="relative w-full rounded-xl overflow-hidden mb-8">
                <div className="relative h-72 md:h-96">
                  {carouselImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`absolute inset-0 transition-opacity duration-500 ${idx === carouselIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                      <Image
                        src={getImageUrl(img)}
                        alt={`${localizedTitle} - ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselImages.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {carouselImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === carouselIndex ? 'bg-white' : 'bg-white/50'}`}
                      aria-label={`Go to image ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : article.image ? (
              <Image
                src={getImageUrl(article.image)}
                alt={localizedTitle}
                width={1200}
                height={600}
                className="w-full rounded-xl mb-8 max-h-96 object-cover"
              />
            ) : carouselImages.length === 1 ? (
              <Image
                src={getImageUrl(carouselImages[0])}
                alt={localizedTitle}
                width={1200}
                height={600}
                className="w-full rounded-xl mb-8 max-h-96 object-cover"
              />
            ) : (
              <div className="w-full h-64 rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-8">
                <Newspaper className="h-20 w-20 text-primary-300" />
              </div>
            )}

            {/* Article Body */}
            <div
              className="prose prose-lg prose-primary max-w-none
                prose-headings:text-primary-800 prose-headings:font-bold
                prose-p:text-slate-700 prose-p:leading-relaxed
                prose-li:text-slate-700
                prose-strong:text-primary-700
                prose-a:text-secondary-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: localizedContent }}
            />

            {/* Source Link */}
            {article.sourceUrl && (
              <div className="mt-6 flex items-center gap-2">
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary-600 hover:text-secondary-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  {locale === 'zh' ? '查看原文' : locale === 'ja' ? '元記事を見る' : locale === 'ar' ? 'عرض المصدر' : 'View Source'}
                </a>
              </div>
            )}

            {/* Share Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 pt-8 border-t border-slate-200"
            >
              <h4 className="font-bold text-primary-800 mb-4">{shareLabel[locale] || shareLabel.en}</h4>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  {locale === 'zh' ? '复制链接' : locale === 'ja' ? 'リンクをコピー' : locale === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                </button>
                <a
                  href={currentUrl ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}` : '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 transition-colors text-sm font-medium"
                >
                  <Link2 className="h-4 w-4" />
                  LinkedIn
                </a>
                <a
                  href={currentUrl ? `mailto:?subject=${encodeURIComponent(localizedTitle)}&body=${encodeURIComponent(currentUrl)}` : `mailto:?subject=${encodeURIComponent(localizedTitle)}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </div>
            </motion.div>

            {/* Back */}
            <div className="mt-8">
              <Link
                href="/news"
                className="btn-outline inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel[locale] || backLabel.en}
              </Link>
            </div>
          </motion.div>

          {/* Sidebar: Related Articles */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="sticky top-24">
              <h3 className="heading-3 mb-6">{relatedLabel[locale] || relatedLabel.en}</h3>
              <div className="space-y-6">
                {relatedArticles.map((ra) => {
                  const raTitleMap: Record<string, string> = {
                    en: ra.titleEn,
                    zh: ra.titleZh,
                    ja: ra.titleJa,
                    ar: ra.titleAr,
                  };
                  const raTitle = getLocalized(raTitleMap, locale, ra.titleEn);
                  const raDate = ra.publishedDateShort || '';

                  return (
                    <Link
                      key={ra.id}
                      href={`/news/${ra.slug}`}
                      className="group block p-4 rounded-xl bg-slate-50 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <CalendarDays className="h-3 w-3" />
                        {raDate}
                      </div>
                      <h4 className="font-semibold text-primary-800 group-hover:text-secondary-600 transition-colors line-clamp-2 text-sm">
                        {raTitle}
                      </h4>
                      {ra.excerpt && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {ra.excerpt}
                        </p>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary-600 mt-2">
                        {tc('readMore')}
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Newsletter CTA in sidebar */}
              <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-primary-700 to-secondary-700 text-white">
                <h4 className="font-bold text-lg mb-2">
                  {locale === 'zh' ? '订阅新闻' : locale === 'ja' ? 'ニュースレター購読' : locale === 'ar' ? 'اشترك في النشرة' : 'Stay Updated'}
                </h4>
                <p className="text-sm text-white/80 mb-4">
                  {locale === 'zh'
                    ? '获取最新行业动态和公司新闻'
                    : locale === 'ja'
                    ? '最新の業界動向と企業ニュースをお届け'
                    : locale === 'ar'
                    ? 'احصل على آخر الأخبار والتحديثات'
                    : 'Get the latest industry news and company updates'}
                </p>
                <Link
                  href="/contact"
                  className="inline-block px-4 py-2 bg-white text-primary-700 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors"
                >
                  {tc('sendMessage')}
                </Link>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
