'use client';

import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Package,
  Search,
  Eye,
  RefreshCw,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  Upload,
  Download,
  X,
  Loader2,
  ChevronDown,
  AlertTriangle,
  FileJson,
  Check,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Category {
  id: string;
  slug: string;
  nameEn: string;
  children?: Category[];
}

interface Product {
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
  images: string;
  specsJson: string;
  videoUrl: string | null;
  pdfUrl: string | null;
  published: boolean;
  featured: boolean;
  status: string;
  categoryId: string;
  category: { id: string; slug: string; nameEn: string } | null;
  createdAt: string;
  updatedAt: string;
}

type FormData = {
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descEn: string;
  descZh: string;
  descJa: string;
  descAr: string;
  sku: string;
  priceUsd: string;
  moq: string;
  leadTimeDays: string;
  categoryId: string;
  images: string;
  specsJson: string;
  videoUrl: string;
  pdfUrl: string;
  featured: boolean;
  published: boolean;
  status: string;
};

const EMPTY_FORM: FormData = {
  nameEn: '',
  nameZh: '',
  nameJa: '',
  nameAr: '',
  descEn: '',
  descZh: '',
  descJa: '',
  descAr: '',
  sku: '',
  priceUsd: '0',
  moq: '1',
  leadTimeDays: '30',
  categoryId: '',
  images: '[]',
  specsJson: '{}',
  videoUrl: '',
  pdfUrl: '',
  featured: false,
  published: true,
  status: 'draft',
};

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-800 ring-green-600/20',
  draft: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  archived: 'bg-orange-100 text-orange-800 ring-orange-600/20',
};

const BATCH_TEMPLATE = [
  {
    nameEn: 'Marine Diesel Engine 200HP',
    nameZh: '船用柴油发动机 200马力',
    nameJa: '船舶用ディーゼルエンジン 200馬力',
    nameAr: 'محرك ديزل بحري 200 حصان',
    descEn: 'High-performance marine diesel engine...',
    descZh: '高性能船用柴油发动机...',
    descJa: '高性能船舶用ディーゼルエンジン...',
    descAr: 'محرك ديزل بحري عالي الأداء...',
    sku: 'MDE-200HP-001',
    priceUsd: 15000,
    moq: 1,
    leadTimeDays: 45,
    categoryId: '<category-uuid>',
    images: '[]',
    specsJson: '{"power":"200HP","fuel":"Diesel"}',
    videoUrl: '',
    pdfUrl: '',
    featured: false,
    published: true,
    status: 'draft',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getFirstImage(images: string): string | null {
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch {
    return null;
  }
}

function flattenCategories(cats: Category[]): Category[] {
  const flat: Category[] = [];
  const walk = (list: Category[], depth: number) => {
    for (const c of list) {
      flat.push({ ...c, nameEn: '—'.repeat(depth) + (depth ? ' ' : '') + c.nameEn });
      if (c.children?.length) walk(c.children, depth + 1);
    }
  };
  walk(cats, 0);
  return flat;
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                         */
/* ------------------------------------------------------------------ */

function DeleteModal({
  product,
  onClose,
  onConfirm,
  deleting,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{product.nameEn}</span> (SKU: {product.sku})?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Form Modal (Create / Edit)                                */
/* ------------------------------------------------------------------ */

function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null; // null = create mode
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState<FormData>(() => {
    if (!product) return EMPTY_FORM;
    return {
      nameEn: product.nameEn,
      nameZh: product.nameZh ?? '',
      nameJa: product.nameJa ?? '',
      nameAr: product.nameAr ?? '',
      descEn: product.descEn ?? '',
      descZh: product.descZh ?? '',
      descJa: product.descJa ?? '',
      descAr: product.descAr ?? '',
      sku: product.sku,
      priceUsd: String(product.priceUsd),
      moq: String(product.moq),
      leadTimeDays: String(product.leadTimeDays),
      categoryId: product.categoryId ?? '',
      images: product.images ?? '[]',
      specsJson: product.specsJson ?? '{}',
      videoUrl: product.videoUrl ?? '',
      pdfUrl: product.pdfUrl ?? '',
      featured: product.featured,
      published: product.published,
      status: product.status ?? 'draft',
    };
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'descriptions' | 'media' | 'advanced'>('general');

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.nameEn.trim()) return toast.error('English name is required');
    if (!form.sku.trim()) return toast.error('SKU is required');
    if (!form.categoryId) return toast.error('Category is required');

    setSaving(true);
    try {
      const payload = {
        nameEn: form.nameEn,
        nameZh: form.nameZh,
        nameJa: form.nameJa,
        nameAr: form.nameAr,
        descEn: form.descEn,
        descZh: form.descZh,
        descJa: form.descJa,
        descAr: form.descAr,
        sku: form.sku,
        priceUsd: parseFloat(form.priceUsd) || 0,
        moq: parseInt(form.moq) || 1,
        leadTimeDays: parseInt(form.leadTimeDays) || 30,
        categoryId: form.categoryId,
        images: form.images,
        specsJson: form.specsJson,
        videoUrl: form.videoUrl || null,
        pdfUrl: form.pdfUrl || null,
        featured: form.featured,
        published: form.published,
        status: form.status,
      };

      const url = isEdit
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(isEdit ? 'Product updated' : 'Product created');
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'general' as const, label: 'General' },
    { key: 'descriptions' as const, label: 'Descriptions' },
    { key: 'media' as const, label: 'Media & Files' },
    { key: 'advanced' as const, label: 'Advanced' },
  ];

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto space-y-5">
          {/* General Tab */}
          {activeTab === 'general' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name (English) *</label>
                  <input className={inputCls} value={form.nameEn} onChange={(e) => set('nameEn', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Name (中文)</label>
                  <input className={inputCls} value={form.nameZh} onChange={(e) => set('nameZh', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Name (日本語)</label>
                  <input className={inputCls} value={form.nameJa} onChange={(e) => set('nameJa', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Name (العربية)</label>
                  <input className={inputCls} dir="rtl" value={form.nameAr} onChange={(e) => set('nameAr', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>SKU *</label>
                  <input className={inputCls} value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="MDE-200HP-001" />
                </div>
                <div>
                  <label className={labelCls}>Category *</label>
                  <select className={inputCls} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.nameEn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Price (USD)</label>
                  <input type="number" step="0.01" min="0" className={inputCls} value={form.priceUsd} onChange={(e) => set('priceUsd', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>MOQ</label>
                  <input type="number" min="1" className={inputCls} value={form.moq} onChange={(e) => set('moq', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Lead Time (days)</label>
                  <input type="number" min="0" className={inputCls} value={form.leadTimeDays} onChange={(e) => set('leadTimeDays', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
            </>
          )}

          {/* Descriptions Tab */}
          {activeTab === 'descriptions' && (
            <>
              {([
                ['descEn', 'Description (English)'],
                ['descZh', 'Description (中文)'],
                ['descJa', 'Description (日本語)'],
                ['descAr', 'Description (العربية)'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    dir={key === 'descAr' ? 'rtl' : undefined}
                  />
                </div>
              ))}
            </>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <>
              <div>
                <label className={labelCls}>Images (JSON array of URLs)</label>
                <textarea rows={3} className={`${inputCls} font-mono text-xs`} value={form.images} onChange={(e) => set('images', e.target.value)} placeholder='["https://example.com/img1.jpg"]' />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Video URL</label>
                  <input className={inputCls} value={form.videoUrl} onChange={(e) => set('videoUrl', e.target.value)} placeholder="https://youtube.com/..." />
                </div>
                <div>
                  <label className={labelCls}>PDF URL</label>
                  <input className={inputCls} value={form.pdfUrl} onChange={(e) => set('pdfUrl', e.target.value)} placeholder="https://example.com/spec.pdf" />
                </div>
              </div>
            </>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div>
              <label className={labelCls}>Specs JSON</label>
              <textarea
                rows={8}
                className={`${inputCls} font-mono text-xs`}
                value={form.specsJson}
                onChange={(e) => set('specsJson', e.target.value)}
                placeholder='{"power": "200HP", "weight": "500kg"}'
              />
              <p className="mt-1 text-xs text-gray-400">
                Enter product specifications as a JSON object. Each key-value pair will be shown in the specs table.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Batch Upload Modal                                                */
/* ------------------------------------------------------------------ */

function BatchUploadModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [jsonText, setJsonText] = useState('');
  const [parsed, setParsed] = useState<Record<string, unknown>[] | null>(null);
  const [parseError, setParseError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tryParse = (text: string) => {
    setJsonText(text);
    setParseError('');
    setParsed(null);
    if (!text.trim()) return;
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('JSON must be an array of products');
      if (data.length === 0) throw new Error('Array is empty');
      if (data.length > 500) throw new Error('Maximum 500 products per batch');
      setParsed(data);
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => tryParse(reader.result as string);
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([JSON.stringify(BATCH_TEMPLATE, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-batch-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!parsed) return;
    setUploading(true);
    try {
      const res = await fetch('/api/admin/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch upload failed');

      const errCount = data.errors?.length ?? 0;
      if (errCount > 0) {
        toast.success(`Created ${data.createdCount} of ${data.totalSubmitted} products`);
        toast.error(`${errCount} product(s) failed — check console for details`);
        console.table(data.errors);
      } else {
        toast.success(`All ${data.createdCount} products created successfully`);
      }
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Batch upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Batch Upload Products
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Actions row */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              Upload JSON File
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
          </div>

          {/* JSON textarea */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Paste JSON array or upload a file above
            </label>
            <textarea
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={jsonText}
              onChange={(e) => tryParse(e.target.value)}
              placeholder={JSON.stringify(BATCH_TEMPLATE, null, 2)}
            />
          </div>

          {/* Parse result */}
          {parseError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {parseError}
            </div>
          )}

          {parsed && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-2">
                <Check className="w-4 h-4" />
                {parsed.length} product(s) ready to upload
              </div>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-green-700">
                      <th className="pr-3 py-1">#</th>
                      <th className="pr-3 py-1">Name</th>
                      <th className="pr-3 py-1">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="text-green-900">
                    {parsed.slice(0, 20).map((p, i) => (
                      <tr key={i}>
                        <td className="pr-3 py-0.5">{i + 1}</td>
                        <td className="pr-3 py-0.5 truncate max-w-[200px]">{String(p.nameEn || '—')}</td>
                        <td className="pr-3 py-0.5 font-mono">{String(p.sku || '—')}</td>
                      </tr>
                    ))}
                    {parsed.length > 20 && (
                      <tr>
                        <td colSpan={3} className="py-1 text-green-600 italic">
                          …and {parsed.length - 20} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!parsed || uploading}
            className="px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            Upload {parsed ? `${parsed.length} Product(s)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [formProduct, setFormProduct] = useState<Product | null | undefined>(undefined); // undefined=closed, null=create, Product=edit
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [showBatch, setShowBatch] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Inline action loading
  const [actionId, setActionId] = useState<string | null>(null);

  /* Fetch categories once */
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => setCategories(flattenCategories(d.categories ?? [])))
      .catch(() => {});
  }, []);

  /* Fetch products */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) qs.set('search', search);
      if (categoryFilter) qs.set('categoryId', categoryFilter);
      if (statusFilter) qs.set('status', statusFilter);

      const res = await fetch(`/api/admin/products?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotal(data.total ?? 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  /* Quick actions */
  const togglePublish = async (p: Product) => {
    setActionId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'togglePublished' }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
      toast.success(updated.published ? 'Product published' : 'Product unpublished');
    } catch {
      toast.error('Failed to toggle publish');
    } finally {
      setActionId(null);
    }
  };

  const toggleFeatured = async (p: Product) => {
    setActionId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleFeatured' }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
      toast.success(updated.featured ? 'Marked as featured' : 'Removed from featured');
    } catch {
      toast.error('Failed to toggle featured');
    } finally {
      setActionId(null);
    }
  };

  const changeStatus = async (p: Product, newStatus: string) => {
    setActionId(p.id);
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setStatus', value: newStatus }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
      toast.success(`Status changed to ${newStatus}`);
    } catch {
      toast.error('Failed to change status');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteProduct.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('Product deleted');
      setDeleteProduct(null);
      fetchProducts();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = async (p: Product) => {
    // Fetch full product for edit
    try {
      const res = await fetch(`/api/admin/products/${p.id}`);
      if (!res.ok) throw new Error();
      const full = await res.json();
      setFormProduct(full);
    } catch {
      toast.error('Failed to load product details');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setShowBatch(true)}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Batch Upload</span>
          </button>
          <button
            onClick={() => setFormProduct(null)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          <button
            onClick={fetchProducts}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            Filters
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name, SKU…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button onClick={handleSearch} className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nameEn}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No products found</p>
          <button
            onClick={() => setFormProduct(null)}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Product
          </button>
        </div>
      )}

      {/* Products Table */}
      {!loading && products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Featured</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const img = getFirstImage(product.images);
                  const busy = actionId === product.id;
                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* Product name + image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                            {img ? (
                              <Image src={img} alt={product.nameEn} width={40} height={40} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                              {product.nameEn}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* SKU */}
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{product.sku}</td>
                      {/* Category */}
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category?.nameEn ?? '—'}</td>
                      {/* Price */}
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">${product.priceUsd.toLocaleString()}</td>
                      {/* Status badge + quick change */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset capitalize ${STATUS_COLORS[product.status] ?? STATUS_COLORS.draft}`}>
                            {product.status}
                          </span>
                          <div className="relative">
                            <select
                              value={product.status}
                              disabled={busy}
                              onChange={(e) => changeStatus(product, e.target.value)}
                              className="appearance-none w-6 h-6 opacity-0 absolute inset-0 cursor-pointer disabled:cursor-wait"
                              title="Change status"
                            />
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            {/* Hidden select options */}
                            <select
                              value={product.status}
                              disabled={busy}
                              onChange={(e) => changeStatus(product, e.target.value)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="archived">Archived</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      {/* Featured toggle */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleFeatured(product)}
                          disabled={busy}
                          className={`p-1 rounded transition-colors disabled:opacity-50 ${
                            product.featured
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100'
                          }`}
                          title={product.featured ? 'Remove featured' : 'Mark as featured'}
                        >
                          {product.featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => togglePublish(product)}
                            disabled={busy}
                            className={`p-1.5 rounded-md transition-colors disabled:opacity-50 ${
                              product.published
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={product.published ? 'Unpublish' : 'Publish'}
                          >
                            {product.published ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <a
                            href={`/en/products/${product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            title="View on site"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setDeleteProduct(product)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
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
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                {/* Page numbers (show up to 5 pages) */}
                {(() => {
                  const pages: number[] = [];
                  let start = Math.max(1, page - 2);
                  const end = Math.min(totalPages, start + 4);
                  start = Math.max(1, end - 4);
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${
                        p === page
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Modals ---- */}

      {/* Product Form Modal (create / edit) */}
      {formProduct !== undefined && (
        <ProductFormModal
          product={formProduct}
          categories={categories}
          onClose={() => setFormProduct(undefined)}
          onSaved={() => {
            setFormProduct(undefined);
            fetchProducts();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteProduct && (
        <DeleteModal
          product={deleteProduct}
          deleting={deleting}
          onClose={() => setDeleteProduct(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Batch Upload */}
      {showBatch && (
        <BatchUploadModal
          onClose={() => setShowBatch(false)}
          onDone={() => {
            setShowBatch(false);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
