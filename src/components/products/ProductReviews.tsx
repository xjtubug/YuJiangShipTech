'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { getCountryFlag } from '@/lib/utils';

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

interface ProductReviewsProps {
  reviews: Review[];
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${
            i < rating ? 'fill-accent-400 text-accent-400' : 'text-slate-300'
          }`}
        />
      ))}
    </div>
  );
}

export default function ProductReviews({ reviews }: ProductReviewsProps) {
  const t = useTranslations('products');

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-primary-400">{t('noReviews')}</p>
      </div>
    );
  }

  const avgRating =
    Math.round(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
    ) / 10;

  return (
    <div>
      <h3 className="heading-3 mb-6">{t('customerReviews')}</h3>

      {/* Average rating */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl">
        <div className="text-4xl font-bold text-primary-800">{avgRating}</div>
        <div>
          <StarRating rating={Math.round(avgRating)} size="lg" />
          <p className="text-sm text-primary-500 mt-1">
            {t('avgRating')} · {reviews.length}{' '}
            {reviews.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-5 bg-white border border-slate-100 rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary-800">
                    {review.author}
                  </span>
                  {review.country && (
                    <span className="text-lg" title={review.country}>
                      {getCountryFlag(review.country)}
                    </span>
                  )}
                </div>
                {review.company && (
                  <p className="text-sm text-primary-500">{review.company}</p>
                )}
              </div>
              <time className="text-xs text-primary-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </time>
            </div>
            <StarRating rating={review.rating} />
            <p className="mt-3 text-primary-600 leading-relaxed">
              {review.contentEn}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
