'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  X,
  Loader2,
  Star,
  RefreshCw,
  Mail,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Expert {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  bio: string | null;
  title: string | null;
  createdAt: string;
  _count: { expertReviews: number };
}

interface ExpertReview {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  expert: { id: string; name: string };
  product: { id: string; nameEn: string };
}

interface Product {
  id: string;
  nameEn: string;
}

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [reviews, setReviews] = useState<ExpertReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpert, setShowAddExpert] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [expertForm, setExpertForm] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    bio: '',
  });

  const [reviewForm, setReviewForm] = useState({
    expertId: '',
    productId: '',
    rating: 5,
    content: '',
  });

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, revRes] = await Promise.all([
        fetch('/api/admin/experts'),
        fetch('/api/admin/expert-reviews'),
      ]);
      if (expRes.ok) {
        const data = await expRes.json();
        setExperts(data.experts);
      }
      if (revRes.ok) {
        const data = await revRes.json();
        setReviews(data.reviews);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products?limit=200');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchExperts();
    fetchProducts();
  }, [fetchExperts, fetchProducts]);

  const handleAddExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expertForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create expert');
      }
      toast.success('Expert created successfully');
      setShowAddExpert(false);
      setExpertForm({ name: '', email: '', password: '', title: '', bio: '' });
      fetchExperts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create expert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/expert-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create review');
      }
      toast.success('Review added successfully');
      setShowAddReview(false);
      setReviewForm({ expertId: '', productId: '', rating: 5, content: '' });
      fetchExperts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Experts</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchExperts}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddReview(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Star className="w-4 h-4" />
            Add Review
          </button>
          <button
            onClick={() => setShowAddExpert(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Expert
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Experts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {experts.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No experts found</p>
            </div>
          )}
          {experts.map((expert) => (
            <div
              key={expert.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
                  {expert.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {expert.name}
                  </h3>
                  {expert.title && (
                    <p className="text-sm text-primary-600 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {expert.title}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" />
                    {expert.email}
                  </p>
                </div>
              </div>

              {expert.bio && (
                <p className="text-sm text-gray-600 line-clamp-3">{expert.bio}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageSquare className="w-4 h-4" />
                  {expert._count.expertReviews} review
                  {expert._count.expertReviews !== 1 ? 's' : ''}
                </div>
                <span className="text-xs text-gray-400">
                  Joined {new Date(expert.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expert Reviews Section */}
      {!loading && reviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Expert Reviews</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm">
                        {review.expert.name}
                      </span>
                      <span className="text-gray-400 text-xs">on</span>
                      <span className="text-primary-600 text-sm font-medium">
                        {review.product.nameEn}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {review.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Expert Modal */}
      {showAddExpert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Add Expert</h3>
              <button
                onClick={() => setShowAddExpert(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpert} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={expertForm.name}
                  onChange={(e) =>
                    setExpertForm({ ...expertForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Expert name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={expertForm.email}
                  onChange={(e) =>
                    setExpertForm({ ...expertForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="expert@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={expertForm.password}
                  onChange={(e) =>
                    setExpertForm({ ...expertForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={expertForm.title}
                  onChange={(e) =>
                    setExpertForm({ ...expertForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. Marine Engineer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={expertForm.bio}
                  onChange={(e) =>
                    setExpertForm({ ...expertForm, bio: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief bio..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpert(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Expert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Review Modal */}
      {showAddReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Add Review</h3>
              <button
                onClick={() => setShowAddReview(false)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddReview} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expert *
                </label>
                <select
                  required
                  value={reviewForm.expertId}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, expertId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select expert...</option>
                  {experts.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product *
                </label>
                <select
                  required
                  value={reviewForm.productId}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, productId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameEn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating *
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rating: val })
                      }
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          val <= reviewForm.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {reviewForm.rating}/5
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewForm.content}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Write the expert review..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReview(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
