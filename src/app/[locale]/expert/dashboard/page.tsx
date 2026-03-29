'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, LogOut, Loader2, X, Upload, Video, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

interface Expert {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  bio?: string | null;
  title?: string | null;
}

interface Product {
  id: string;
  nameZh: string;
  nameEn: string;
  sku: string;
  images: string;
  slug: string;
  _count?: { expertReviews: number };
}

interface ExpertReview {
  id: string;
  productId: string;
  content: string;
  rating: number;
  images: string;
  videoUrl?: string | null;
  createdAt: string;
  product: { nameZh: string; nameEn: string; sku: string };
}

export default function ExpertDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'en';

  const [expert, setExpert] = useState<Expert | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [myReviews, setMyReviews] = useState<ExpertReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [reviewVideoUrl, setReviewVideoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchExpert = useCallback(async () => {
    try {
      const res = await fetch('/api/expert/me');
      if (!res.ok) {
        router.push(`/${locale}/expert/login`);
        return;
      }
      const data = await res.json();
      setExpert(data);
    } catch {
      router.push(`/${locale}/expert/login`);
    }
  }, [locale, router]);

  const fetchProducts = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/products?page=${p}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      console.error('Failed to fetch products');
    }
  }, []);

  const fetchMyReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/expert/reviews');
      if (res.ok) {
        const data = await res.json();
        setMyReviews(data.reviews || []);
      }
    } catch {
      console.error('Failed to fetch reviews');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchExpert();
      await Promise.all([fetchProducts(1), fetchMyReviews()]);
      setLoading(false);
    };
    init();
  }, [fetchExpert, fetchProducts, fetchMyReviews]);

  useEffect(() => {
    fetchProducts(page);
  }, [page, fetchProducts]);

  const handleLogout = async () => {
    document.cookie = 'expert_session=; path=/; max-age=0';
    router.push(`/${locale}/expert/login`);
  };

  const openReviewModal = (product: Product) => {
    setSelectedProduct(product);
    setReviewContent('');
    setReviewRating(5);
    setReviewImages([]);
    setReviewVideoUrl('');
    setShowModal(true);
  };

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
          setReviewImages(prev => [...prev, data.url]);
        }
      }
    } catch {
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct || !reviewContent.trim()) {
      toast.error('请填写评价内容');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/expert/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          content: reviewContent,
          rating: reviewRating,
          images: reviewImages,
          videoUrl: reviewVideoUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '提交失败');
      }
      toast.success('评价已提交');
      setShowModal(false);
      fetchMyReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '提交失败';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getReviewCountForProduct = (productId: string) => {
    return myReviews.filter(r => r.productId === productId).length;
  };

  const getProductImage = (product: Product) => {
    try {
      const imgs = JSON.parse(product.images);
      return Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : '/images/placeholder.jpg';
    } catch {
      return '/images/placeholder.jpg';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expert?.avatar && (
              <Image src={expert.avatar} alt={expert?.name || 'Expert avatar'} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{expert?.name}</h1>
              <p className="text-sm text-gray-500">{expert?.title || '专家评审员'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">退出</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* My Reviews Summary */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">我的评价</h2>
          <p className="text-gray-500">已完成 {myReviews.length} 条产品评价</p>
        </div>

        {/* Products Grid */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">产品列表</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="aspect-video bg-gray-100 relative">
                <Image src={getProductImage(product)} alt={product.nameZh} width={800} height={450} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{product.nameZh}</h3>
                <p className="text-sm text-gray-500 mb-1">{product.nameEn}</p>
                <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    我的评价: {getReviewCountForProduct(product.id)} 条
                  </span>
                  <button
                    onClick={() => openReviewModal(product)}
                    className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition"
                  >
                    写评价
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> 上一页
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              下一页 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">写评价</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">{selectedProduct.nameZh} ({selectedProduct.sku})</p>

              {/* Star Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">评分</label>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <button key={i} type="button" onClick={() => setReviewRating(i + 1)}>
                      <Star className={`w-8 h-8 transition ${i < reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">{reviewRating}/5</span>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">评价内容</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="请输入您对该产品的专业评价..."
                />
              </div>

              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />图片 (可选)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {reviewImages.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20">
                      <Image src={img} alt={`product-img-${idx}`} width={400} height={300} className="w-full h-full object-cover rounded-lg" />
                      <button
                        onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="text-sm text-gray-600">{uploading ? '上传中...' : '上传图片'}</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {/* Video URL */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="w-4 h-4 inline mr-1" />视频链接 (可选)
                </label>
                <input
                  type="url"
                  value={reviewVideoUrl}
                  onChange={(e) => setReviewVideoUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitReview}
                disabled={submitting || !reviewContent.trim()}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {submitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
