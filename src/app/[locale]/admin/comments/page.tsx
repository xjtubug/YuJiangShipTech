'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Star, Eye, EyeOff, Pencil, Trash2, Search,
  ChevronLeft, ChevronRight, Loader2, ImagePlus, X, Check,
} from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';

/* ---------- types ---------- */
interface Product {
  nameZh: string;
  nameEn: string;
  slug: string;
}

interface Comment {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  content: string;
  images: string; // JSON string of URL[]
  rating: number;
  approved: boolean;
  createdAt: string;
  product: Product;
}

type StatusFilter = 'all' | 'pending' | 'approved';

/* ---------- helpers ---------- */
function parseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Stars({ count, size = 'w-4 h-4' }: { count: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </span>
  );
}

/* ---------- main page ---------- */
export default function CommentsAdminPage() {
  /* --- list state --- */
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<StatusFilter>('all');

  /* --- modals --- */
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* --- edit form state --- */
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    country: '',
    content: '',
    rating: 5,
    images: [] as string[],
  });
  const [uploading, setUploading] = useState(false);

  /* ============ fetch list ============ */
  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ status, page: String(page) });
      const res = await fetch(`/api/admin/comments?${qs}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data.comments ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error('加载评价列表失败');
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  /* ============ toggle visibility ============ */
  const toggleApproval = async (c: Comment) => {
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, approved: !c.approved }),
      });
      if (!res.ok) throw new Error();
      toast.success(c.approved ? '已隐藏评价' : '已展示评价');
      setComments((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, approved: !x.approved } : x)),
      );
    } catch {
      toast.error('操作失败');
    }
  };

  /* ============ open edit modal ============ */
  const openEdit = (c: Comment) => {
    setEditComment(c);
    setEditForm({
      name: c.name || '',
      company: c.company || '',
      country: c.country || '',
      content: c.content || '',
      rating: c.rating || 5,
      images: parseImages(c.images),
    });
  };

  /* ============ save edit ============ */
  const handleSaveEdit = async () => {
    if (!editComment) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editComment.id,
          name: editForm.name,
          company: editForm.company,
          country: editForm.country,
          content: editForm.content,
          rating: editForm.rating,
          images: JSON.stringify(editForm.images),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success('评价已更新');
      setComments((prev) =>
        prev.map((x) => (x.id === editComment.id ? { ...x, ...data.comment } : x)),
      );
      setEditComment(null);
    } catch {
      toast.error('保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============ image upload ============ */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append('file', files[i]);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error();
        const data = await res.json();
        newUrls.push(data.url);
      }
      setEditForm((prev) => ({ ...prev, images: [...prev.images, ...newUrls] }));
      toast.success('图片上传成功');
    } catch {
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setEditForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  /* ============ delete ============ */
  const handleDelete = async () => {
    if (!deleteId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/comments?id=${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('评价已删除');
      setDeleteId(null);
      fetchComments();
    } catch {
      toast.error('删除失败');
    } finally {
      setSubmitting(false);
    }
  };

  /* ============ tab counts label ============ */
  const tabs: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
  ];

  /* ============ pagination helpers ============ */
  const pageNumbers = (() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  /* ============ render ============ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户评价管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {total} 条评价
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 inline-flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setStatus(t.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === t.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无评价数据</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">客户名称</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">产品</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">评分</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 min-w-[200px]">评价内容</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">图片</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => {
                  const imgs = parseImages(c.images);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-gray-100 hover:bg-primary-50/40 transition-colors"
                    >
                      {/* 客户名称 */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{c.name || '-'}</div>
                        {c.company && (
                          <div className="text-xs text-gray-500">{c.company}</div>
                        )}
                      </td>

                      {/* 产品 */}
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {c.product?.nameZh || '-'}
                      </td>

                      {/* 评分 */}
                      <td className="px-4 py-3">
                        <Stars count={c.rating} />
                      </td>

                      {/* 评价内容 */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                          {c.content || '-'}
                        </p>
                      </td>

                      {/* 图片 */}
                      <td className="px-4 py-3">
                        {imgs.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="w-8 h-8 rounded border border-gray-200 overflow-hidden relative">
                              <Image
                                src={getImageUrl(imgs[0])}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            {imgs.length > 1 && (
                              <span className="text-xs text-gray-500">+{imgs.length - 1}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>

                      {/* 状态 */}
                      <td className="px-4 py-3">
                        {c.approved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <Check className="w-3 h-3" /> 已展示
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            待审核
                          </span>
                        )}
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle visibility */}
                          <button
                            onClick={() => toggleApproval(c)}
                            title={c.approved ? '隐藏' : '展示'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              c.approved
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {c.approved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEdit(c)}
                            title="编辑"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteId(c.id)}
                            title="删除"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                第 {page} / {totalPages} 页，共 {total} 条
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1.5 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`min-w-[32px] h-8 rounded border text-sm font-medium ${
                      n === page
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1.5 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========== Edit Modal ========== */}
      {editComment && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Pencil className="w-4 h-4" /> 编辑评价
              </h3>
              <button
                onClick={() => setEditComment(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户名称</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">国家</label>
                <input
                  type="text"
                  value={editForm.country}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">评价内容</label>
                <textarea
                  rows={4}
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, rating: i })}
                      className="p-0.5"
                    >
                      <Star
                        className={`w-6 h-6 cursor-pointer transition-colors ${
                          i <= editForm.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500">{editForm.rating} / 5</span>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
                <div className="flex flex-wrap gap-2">
                  {editForm.images.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden group"
                    >
                      <Image
                        src={getImageUrl(url)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Upload button */}
                  <label className="flex items-center justify-center w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-500 cursor-pointer transition-colors">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditComment(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== Delete Confirm Modal ========== */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可撤销，确定要删除该评价吗？</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
