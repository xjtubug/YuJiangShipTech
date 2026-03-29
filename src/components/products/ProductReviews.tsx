'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Loader2, Upload, CheckCircle, Award } from 'lucide-react';
import { getCountryFlag } from '@/lib/utils';
import toast, { Toaster } from 'react-hot-toast';

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
  images: string;
  videoUrl?: string | null;
  createdAt: string;
  expert: { name: string; title?: string | null; avatar?: string | null };
}

interface CustomerCommentData {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  country?: string | null;
  content: string;
  rating: number;
  images: string;
  createdAt: string;
}

interface ProductReviewsProps {
  reviews: Review[];
  slug?: string;
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

function InteractiveStarRating({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}>
          <Star className={`w-6 h-6 transition ${i < rating ? 'fill-accent-400 text-accent-400' : 'text-slate-300 hover:text-accent-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ reviews, slug }: ProductReviewsProps) {
  const t = useTranslations('products');

  const [expertReviews, setExpertReviews] = useState<ExpertReviewData[]>([]);
  const [customerComments, setCustomerComments] = useState<CustomerCommentData[]>([]);

  // Comment form state
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentCompany, setCommentCompany] = useState('');
  const [commentCountry, setCommentCountry] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [commentImages, setCommentImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/comments/by-slug/${slug}`)
      .then(res => res.json())
      .then(data => {
        setCustomerComments(data.comments || []);
      })
      .catch(() => {});

    fetch(`/api/products/${slug}/expert-reviews`)
      .then(res => res.json())
      .then(data => {
        setExpertReviews(data.reviews || []);
      })
      .catch(() => {});
  }, [slug]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const data = await res.json();
          setCommentImages(prev => [...prev, data.url]);
        }
      }
    } catch {
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !commentName.trim() || !commentEmail.trim() || !commentContent.trim()) {
      toast.error('请填写必要信息');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/by-slug/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: commentName,
          email: commentEmail,
          company: commentCompany || undefined,
          country: commentCountry || undefined,
          content: commentContent,
          rating: commentRating,
          images: commentImages,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }
      setSubmitted(true);
      setShowCommentForm(false);
      setCommentName('');
      setCommentEmail('');
      setCommentCompany('');
      setCommentCountry('');
      setCommentContent('');
      setCommentRating(5);
      setCommentImages([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const allReviews = reviews;
  const hasAnyContent = allReviews.length > 0 || expertReviews.length > 0 || customerComments.length > 0;

  const avgRating = allReviews.length > 0
    ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10
    : 0;

  return (
    <div>
      <Toaster />

      {/* Average rating (from original reviews) */}
      {allReviews.length > 0 && (
        <>
          <h3 className="heading-3 mb-6">{t('customerReviews')}</h3>
          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl">
            <div className="text-4xl font-bold text-primary-800">{avgRating}</div>
            <div>
              <StarRating rating={Math.round(avgRating)} size="lg" />
              <p className="text-sm text-primary-500 mt-1">
                {t('avgRating')} · {allReviews.length}{' '}
                {allReviews.length === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
          <div className="space-y-4 mb-8">
            {allReviews.map((review) => (
              <div key={review.id} className="p-5 bg-white border border-slate-100 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary-800">{review.author}</span>
                      {review.country && (
                        <span className="text-lg" title={review.country}>{getCountryFlag(review.country)}</span>
                      )}
                    </div>
                    {review.company && <p className="text-sm text-primary-500">{review.company}</p>}
                  </div>
                  <time className="text-xs text-primary-400">{new Date(review.createdAt).toLocaleDateString()}</time>
                </div>
                <StarRating rating={review.rating} />
                <p className="mt-3 text-primary-600 leading-relaxed">{review.contentEn}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Expert Reviews Section */}
      {expertReviews.length > 0 && (
        <div className="mb-8">
          <h3 className="heading-3 mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-600" />
            专家评价
          </h3>
          <div className="space-y-4">
            {expertReviews.map((review) => {
              const images = (() => { try { return JSON.parse(review.images); } catch { return []; } })();
              return (
                <div key={review.id} className="p-5 bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {review.expert.avatar ? (
                        <img src={review.expert.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-primary-200 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-primary-600" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-primary-800">{review.expert.name}</span>
                        {review.expert.title && (
                          <p className="text-sm text-primary-500">{review.expert.title}</p>
                        )}
                      </div>
                    </div>
                    <time className="text-xs text-primary-400">{new Date(review.createdAt).toLocaleDateString()}</time>
                  </div>
                  <StarRating rating={review.rating} />
                  <p className="mt-3 text-primary-600 leading-relaxed">{review.content}</p>
                  {images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                  {review.videoUrl && (
                    <a href={review.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
                      🎬 观看视频评价
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Comments Section */}
      {customerComments.length > 0 && (
        <div className="mb-8">
          <h3 className="heading-3 mb-6">客户留言</h3>
          <div className="space-y-4">
            {customerComments.map((comment) => {
              const images = (() => { try { return JSON.parse(comment.images); } catch { return []; } })();
              return (
                <div key={comment.id} className="p-5 bg-white border border-slate-100 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary-800">{comment.name}</span>
                        {comment.country && (
                          <span className="text-lg" title={comment.country}>{getCountryFlag(comment.country)}</span>
                        )}
                      </div>
                      {comment.company && <p className="text-sm text-primary-500">{comment.company}</p>}
                    </div>
                    <time className="text-xs text-primary-400">{new Date(comment.createdAt).toLocaleDateString()}</time>
                  </div>
                  <StarRating rating={comment.rating} />
                  <p className="mt-3 text-primary-600 leading-relaxed">{comment.content}</p>
                  {images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasAnyContent && !slug && (
        <div className="text-center py-12">
          <p className="text-primary-400">{t('noReviews')}</p>
        </div>
      )}

      {/* Submitted success message */}
      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">您的留言已提交，审核通过后将展示</p>
        </div>
      )}

      {/* Write Comment Button & Form */}
      {slug && !showCommentForm && !submitted && (
        <button
          onClick={() => setShowCommentForm(true)}
          className="w-full py-3 border-2 border-dashed border-primary-300 text-primary-600 rounded-xl hover:bg-primary-50 transition font-medium"
        >
          ✍️ 写留言
        </button>
      )}

      {showCommentForm && (
        <form onSubmit={handleSubmitComment} className="mt-6 p-6 bg-white border border-slate-200 rounded-xl space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">写留言</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
              <input type="text" value={commentName} onChange={(e) => setCommentName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
              <input type="email" value={commentEmail} onChange={(e) => setCommentEmail(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">公司 (可选)</label>
              <input type="text" value={commentCompany} onChange={(e) => setCommentCompany(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">国家 (可选)</label>
              <input type="text" value={commentCountry} onChange={(e) => setCommentCountry(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
            <InteractiveStarRating rating={commentRating} onChange={setCommentRating} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">留言内容 *</label>
            <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} required rows={4}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500"
              placeholder="请输入您的留言..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">图片 (可选)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {commentImages.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16">
                  <img src={img} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button type="button" onClick={() => setCommentImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span className="text-sm text-gray-600">{uploading ? '上传中...' : '上传图片'}</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? '提交中...' : '提交留言'}
            </button>
            <button type="button" onClick={() => setShowCommentForm(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
              取消
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
