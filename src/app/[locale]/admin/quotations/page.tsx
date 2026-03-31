'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  RefreshCw,
  Search,
  Download,
  Edit3,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  X,
  Package,
  ShoppingCart,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface QuotationItem {
  id?: string;
  productId?: string | null;
  productName: string;
  description?: string | null;
  sku?: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  sortOrder: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  inquiryId?: string | null;
  inquiry?: { id: string; inquiryNumber: string } | null;
  customerId?: string | null;
  customer?: { id: string; name: string; company: string | null } | null;
  contactName: string;
  companyName: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  currency: string;
  subtotal: number;
  discount: number;
  tax: number;
  shippingCost: number;
  grandTotal: number;
  validDays: number;
  paymentTerms: string;
  deliveryTerms?: string | null;
  notes?: string | null;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  sentAt?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: QuotationItem[];
}

interface ProductOption {
  id: string;
  nameEn: string;
  sku: string;
  priceUsd: number;
}

interface FormItem {
  productId: string;
  productName: string;
  description: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface FormData {
  inquiryId: string;
  customerId: string;
  contactName: string;
  companyName: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  discount: number;
  tax: number;
  shippingCost: number;
  validDays: number;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  items: FormItem[];
}

// ─── Constants ───────────────────────────────────────────────

const STATUSES = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'] as const;

const STATUS_LABELS: Record<string, string> = {
  all: '全部',
  draft: '草稿',
  sent: '已发送',
  accepted: '已接受',
  rejected: '已拒绝',
  expired: '已过期',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  sent: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  accepted: 'bg-green-100 text-green-800 ring-green-600/20',
  rejected: 'bg-red-100 text-red-800 ring-red-600/20',
  expired: 'bg-orange-100 text-orange-800 ring-orange-600/20',
};

const TAB_COLORS: Record<string, string> = {
  all: 'bg-primary-600 text-white',
  draft: 'bg-gray-600 text-white',
  sent: 'bg-indigo-600 text-white',
  accepted: 'bg-green-600 text-white',
  rejected: 'bg-red-600 text-white',
  expired: 'bg-orange-500 text-white',
};

const EMPTY_ITEM: FormItem = {
  productId: '',
  productName: '',
  description: '',
  sku: '',
  quantity: 1,
  unit: 'pcs',
  unitPrice: 0,
};

const INITIAL_FORM: FormData = {
  inquiryId: '',
  customerId: '',
  contactName: '',
  companyName: '',
  email: '',
  phone: '',
  country: '',
  currency: 'USD',
  discount: 0,
  tax: 0,
  shippingCost: 0,
  validDays: 30,
  paymentTerms: 'T/T 30% deposit, 70% before shipment',
  deliveryTerms: 'FOB Zhoushan',
  notes: '',
  items: [{ ...EMPTY_ITEM }],
};

// ─── Currency formatting ─────────────────────────────────────

function fmtCurrency(amount: number, currency: string = 'USD'): string {
  const sym: Record<string, string> = { USD: '$', EUR: '€', CNY: '¥', JPY: '¥', GBP: '£' };
  return `${sym[currency] ?? currency + ' '}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Main Component ──────────────────────────────────────────

export default function QuotationsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // List state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch quotations ────────────────────────────────────
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      if (searchQuery.trim()) qs.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/quotations?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setQuotations(data.quotations);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  // Fetch products for dropdown
  useEffect(() => {
    fetch('/api/admin/products?limit=100')
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products.map((p: ProductOption & Record<string, unknown>) => ({
          id: p.id,
          nameEn: p.nameEn,
          sku: p.sku,
          priceUsd: p.priceUsd,
        })));
      })
      .catch(() => {});
  }, []);

  // Handle inquiry-to-quotation prefill from URL params
  useEffect(() => {
    const inquiryId = searchParams.get('fromInquiry');
    if (inquiryId) {
      fetch(`/api/admin/inquiries?includeFollowUps=false&page=1&limit=100`)
        .then((r) => r.json())
        .then((data) => {
          const inquiry = data.inquiries?.find((i: Record<string, string>) => i.id === inquiryId);
          if (inquiry) {
            setForm({
              ...INITIAL_FORM,
              inquiryId: inquiry.id,
              contactName: inquiry.contactName || '',
              companyName: inquiry.companyName || '',
              email: inquiry.email || '',
              phone: inquiry.phone || '',
              country: inquiry.country || '',
              items: inquiry.items?.length
                ? inquiry.items.map((it: Record<string, unknown>) => ({
                    productId: (it.productId as string) || '',
                    productName: (it.productName as string) || '',
                    description: '',
                    sku: '',
                    quantity: Number(it.quantity) || 1,
                    unit: (it.unit as string) || 'pcs',
                    unitPrice: 0,
                  }))
                : [{ ...EMPTY_ITEM }],
            });
            setEditingId(null);
            setShowModal(true);
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  // ─── Form handlers ───────────────────────────────────────
  const updateField = (field: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (idx: number, field: keyof FormItem, value: string | number) => {
    setForm((prev) => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...EMPTY_ITEM }] }));
  };

  const removeItem = (idx: number) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const selectProduct = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setForm((prev) => {
        const items = [...prev.items];
        items[idx] = {
          ...items[idx],
          productId: product.id,
          productName: product.nameEn,
          sku: product.sku,
          unitPrice: product.priceUsd,
        };
        return { ...prev, items };
      });
    }
  };

  const calcSubtotal = () =>
    form.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const calcGrandTotal = () =>
    calcSubtotal() - form.discount + form.tax + form.shippingCost;

  // ─── Open edit modal ─────────────────────────────────────
  const openEdit = (q: Quotation) => {
    setEditingId(q.id);
    setForm({
      inquiryId: q.inquiryId || '',
      customerId: q.customerId || '',
      contactName: q.contactName,
      companyName: q.companyName,
      email: q.email,
      phone: q.phone || '',
      country: q.country || '',
      currency: q.currency,
      discount: q.discount,
      tax: q.tax,
      shippingCost: q.shippingCost,
      validDays: q.validDays,
      paymentTerms: q.paymentTerms,
      deliveryTerms: q.deliveryTerms || '',
      notes: q.notes || '',
      items: q.items.map((it) => ({
        productId: it.productId || '',
        productName: it.productName,
        description: it.description || '',
        sku: it.sku || '',
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
      })),
    });
    setShowModal(true);
  };

  // ─── Open create modal ────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, items: [{ ...EMPTY_ITEM }] });
    setShowModal(true);
  };

  // ─── Save quotation ──────────────────────────────────────
  const handleSave = async () => {
    if (!form.contactName || !form.companyName || !form.email) {
      toast.error('请填写客户信息（联系人、公司、邮箱）');
      return;
    }
    if (form.items.every((it) => !it.productName)) {
      toast.error('请至少添加一个产品');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        items: form.items
          .filter((it) => it.productName)
          .map((it) => ({
            ...it,
            productId: it.productId || null,
          })),
      };

      const url = editingId
        ? `/api/admin/quotations/${editingId}`
        : '/api/admin/quotations';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(editingId ? '报价单已更新' : '报价单已创建');
      setShowModal(false);
      fetchQuotations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete quotation ────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个草稿报价单吗？')) return;
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('报价单已删除');
      fetchQuotations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    }
  };

  // ─── Quotation actions ────────────────────────────────────
  const performAction = async (id: string, action: string, notes?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/quotations/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Action failed');
      }
      const actionLabels: Record<string, string> = {
        send: '已发送客户',
        accept: '客户已接受',
        reject: '客户已拒绝',
      };
      toast.success(actionLabels[action] || '操作成功');
      fetchQuotations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Download PDF ─────────────────────────────────────────
  const downloadPdf = async (id: string, number: string) => {
    try {
      const res = await fetch(`/api/admin/quotations/${id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF下载失败');
    }
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">报价管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchQuotations}
            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建报价
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索报价号、公司、邮箱..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? TAB_COLORS[s]
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-6 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && quotations.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无报价单</p>
        </div>
      )}

      {/* Table */}
      {!loading && quotations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">报价号</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">公司</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">联系人</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">总金额</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">创建时间</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((q) => (
                  <QuotationRow
                    key={q.id}
                    q={q}
                    expanded={expandedId === q.id}
                    onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    onEdit={() => openEdit(q)}
                    onDelete={() => handleDelete(q.id)}
                    onAction={performAction}
                    onDownloadPdf={() => downloadPdf(q.id, q.quotationNumber)}
                    onCreateOrder={() => router.push(`orders?fromQuotation=${q.id}`)}
                    actionLoading={actionLoading}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">
                第 {page} / {totalPages} 页（共 {total} 条）
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Create / Edit Modal ───────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? '编辑报价单' : '新建报价单'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">客户信息</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">联系人 *</label>
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Contact Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">公司名称 *</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">邮箱 *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">电话</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Phone"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">国家</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">货币</label>
                    <select
                      value={form.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="CNY">CNY (¥)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">产品明细</h3>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> 添加产品
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        {/* Product selector */}
                        <div className="sm:col-span-4">
                          <label className="block text-xs text-gray-500 mb-1">产品</label>
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              if (e.target.value) selectProduct(idx, e.target.value);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="">选择产品或手动输入</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nameEn} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* Product name */}
                        <div className="sm:col-span-3">
                          <label className="block text-xs text-gray-500 mb-1">产品名称 *</label>
                          <input
                            type="text"
                            value={item.productName}
                            onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="Product Name"
                          />
                        </div>
                        {/* SKU */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">SKU</label>
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                            placeholder="SKU"
                          />
                        </div>
                        {/* Quantity */}
                        <div className="sm:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">数量</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        {/* Unit */}
                        <div className="sm:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">单位</label>
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        {/* Unit Price */}
                        <div className="sm:col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">单价</label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-500 mr-2"
                          placeholder="备注说明 (可选)"
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            小计: {fmtCurrency(item.quantity * item.unitPrice, form.currency)}
                          </span>
                          {form.items.length > 1 && (
                            <button
                              onClick={() => removeItem(idx)}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Terms */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Terms */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">付款条件</label>
                    <input
                      type="text"
                      value={form.paymentTerms}
                      onChange={(e) => updateField('paymentTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">交货条件</label>
                    <input
                      type="text"
                      value={form.deliveryTerms}
                      onChange={(e) => updateField('deliveryTerms', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g. FOB Zhoushan"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">有效天数</label>
                    <input
                      type="number"
                      min={1}
                      value={form.validDays}
                      onChange={(e) => updateField('validDays', parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">备注</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>

                {/* Right: Financial summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">金额汇总</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">小计</span>
                    <span className="font-medium">{fmtCurrency(calcSubtotal(), form.currency)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 w-16">折扣</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.discount}
                      onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 w-16">税费</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.tax}
                      onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 w-16">运费</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.shippingCost}
                      onChange={(e) => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-gray-900">合计</span>
                    <span className="text-lg font-bold text-primary-700">
                      {fmtCurrency(calcGrandTotal(), form.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : editingId ? '更新报价' : '创建报价'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quotation Row Component ─────────────────────────────────

function QuotationRow({
  q,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAction,
  onDownloadPdf,
  onCreateOrder,
  actionLoading,
}: {
  q: Quotation;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAction: (id: string, action: string, notes?: string) => void;
  onDownloadPdf: () => void;
  onCreateOrder: () => void;
  actionLoading: string | null;
}) {
  const isLoading = actionLoading === q.id;

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </td>
        <td className="px-4 py-3 text-sm font-mono text-gray-600 whitespace-nowrap">
          {q.quotationNumber}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-800">
          {q.companyName}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{q.contactName}</td>
        <td className="px-4 py-3 text-sm font-medium text-gray-800 text-right whitespace-nowrap">
          {fmtCurrency(q.grandTotal, q.currency)}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${
              STATUS_COLORS[q.status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20'
            }`}
          >
            {STATUS_LABELS[q.status] || q.status}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {new Date(q.createdAt).toLocaleDateString('zh-CN')}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {/* Edit - only draft */}
            {q.status === 'draft' && (
              <button
                onClick={onEdit}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                title="编辑"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            {/* PDF Download */}
            <button
              onClick={onDownloadPdf}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-indigo-600"
              title="下载PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            {/* Send to customer - draft */}
            {q.status === 'draft' && (
              <button
                onClick={() => onAction(q.id, 'send')}
                disabled={isLoading}
                className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 disabled:opacity-50"
                title="发送客户"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
            {/* Accept / Reject */}
            {q.status === 'sent' && (
              <>
                <button
                  onClick={() => onAction(q.id, 'accept')}
                  disabled={isLoading}
                  className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600 disabled:opacity-50"
                  title="客户接受"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onAction(q.id, 'reject')}
                  disabled={isLoading}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  title="客户拒绝"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            {/* Delete - draft only */}
            {q.status === 'draft' && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {/* Create Order - accepted only */}
            {q.status === 'accepted' && (
              <button
                onClick={onCreateOrder}
                className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600"
                title="创建订单"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {/* Expanded Detail */}
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan={8} className="px-8 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
              {/* Info */}
              <div className="space-y-2">
                <div>
                  <span className="text-gray-500 font-medium">邮箱: </span>
                  <span className="text-gray-700">{q.email}</span>
                </div>
                {q.phone && (
                  <div>
                    <span className="text-gray-500 font-medium">电话: </span>
                    <span className="text-gray-700">{q.phone}</span>
                  </div>
                )}
                {q.country && (
                  <div>
                    <span className="text-gray-500 font-medium">国家: </span>
                    <span className="text-gray-700">{q.country}</span>
                  </div>
                )}
                {q.inquiry && (
                  <div>
                    <span className="text-gray-500 font-medium">关联询价: </span>
                    <span className="text-blue-600">{q.inquiry.inquiryNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 font-medium">创建人: </span>
                  <span className="text-gray-700">{q.createdBy}</span>
                </div>
                {q.sentAt && (
                  <div>
                    <span className="text-gray-500 font-medium">发送时间: </span>
                    <span className="text-gray-700">{new Date(q.sentAt).toLocaleString('zh-CN')}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 font-medium">付款条件: </span>
                  <span className="text-gray-700">{q.paymentTerms}</span>
                </div>
                {q.deliveryTerms && (
                  <div>
                    <span className="text-gray-500 font-medium">交货条件: </span>
                    <span className="text-gray-700">{q.deliveryTerms}</span>
                  </div>
                )}
                {q.notes && (
                  <div>
                    <span className="text-gray-500 font-medium">备注: </span>
                    <span className="text-gray-700">{q.notes}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="lg:col-span-2">
                <span className="text-gray-500 font-medium block mb-2">产品明细:</span>
                <div className="space-y-2">
                  {q.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-white rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-gray-800 font-medium">{item.productName}</span>
                          {item.sku && (
                            <span className="text-gray-400 text-xs ml-2">({item.sku})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <span className="text-gray-500">
                          {item.quantity} {item.unit} × {fmtCurrency(item.unitPrice, q.currency)}
                        </span>
                        <span className="ml-3 font-medium text-gray-800">
                          {fmtCurrency(item.total, q.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Summary */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-1 text-right">
                  <div className="text-gray-500">小计: {fmtCurrency(q.subtotal, q.currency)}</div>
                  {q.discount > 0 && (
                    <div className="text-gray-500">折扣: -{fmtCurrency(q.discount, q.currency)}</div>
                  )}
                  {q.tax > 0 && (
                    <div className="text-gray-500">税费: {fmtCurrency(q.tax, q.currency)}</div>
                  )}
                  {q.shippingCost > 0 && (
                    <div className="text-gray-500">运费: {fmtCurrency(q.shippingCost, q.currency)}</div>
                  )}
                  <div className="text-base font-bold text-primary-700">
                    合计: {fmtCurrency(q.grandTotal, q.currency)}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
