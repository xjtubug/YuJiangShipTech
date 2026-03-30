'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  RefreshCw,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Package,
  Truck,
  Clock,
  ExternalLink,
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  MapPin,
  BarChart3,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface OrderItem {
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

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdBy: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  quotationId?: string | null;
  quotation?: { id: string; quotationNumber: string } | null;
  inquiryId?: string | null;
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
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  status: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  carrier: string | null;
  carrierName: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  currentStatus: string;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}

interface AnalyticsData {
  conversionRates: {
    inquiryToQuotation: number;
    quotationToOrder: number;
    orderCompletion: number;
  };
  totals: {
    inquiries: number;
    quotations: number;
    orders: number;
    completedOrders: number;
    cancelledOrders: number;
  };
  revenueByMonth: { month: string; revenue: number; count: number }[];
  averageOrderValue: number;
  totalRevenue: number;
  statusDistribution: { status: string; count: number }[];
  topCustomers: { companyName: string; email: string; totalValue: number; orderCount: number }[];
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
  quotationId: string;
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
  paymentTerms: string;
  deliveryTerms: string;
  shippingMethod: string;
  trackingNumber: string;
  shippingAddress: string;
  notes: string;
  items: FormItem[];
}

// ─── Constants ───────────────────────────────────────────────

const STATUSES = [
  'all', 'confirmed', 'in_production', 'quality_check', 'ready_to_ship',
  'shipped', 'in_transit', 'delivered', 'completed', 'cancelled',
] as const;

const STATUS_LABELS: Record<string, string> = {
  all: '全部',
  confirmed: '已确认',
  in_production: '生产中',
  quality_check: '质检中',
  ready_to_ship: '待发货',
  shipped: '已发货',
  in_transit: '运输中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  in_production: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  quality_check: 'bg-orange-100 text-orange-800 ring-orange-600/20',
  ready_to_ship: 'bg-cyan-100 text-cyan-800 ring-cyan-600/20',
  shipped: 'bg-purple-100 text-purple-800 ring-purple-600/20',
  in_transit: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  delivered: 'bg-green-100 text-green-800 ring-green-600/20',
  completed: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  cancelled: 'bg-red-100 text-red-800 ring-red-600/20',
};

const TAB_COLORS: Record<string, string> = {
  all: 'bg-primary-600 text-white',
  confirmed: 'bg-blue-600 text-white',
  in_production: 'bg-yellow-500 text-white',
  quality_check: 'bg-orange-500 text-white',
  ready_to_ship: 'bg-cyan-600 text-white',
  shipped: 'bg-purple-600 text-white',
  in_transit: 'bg-indigo-600 text-white',
  delivered: 'bg-green-600 text-white',
  completed: 'bg-emerald-600 text-white',
  cancelled: 'bg-red-600 text-white',
};

const SHIPPING_METHODS: Record<string, string> = {
  dhl: 'DHL Express',
  fedex: 'FedEx',
  sea_freight: '海运',
  air_freight: '空运',
};

const NEXT_STATUS: Record<string, string> = {
  confirmed: 'in_production',
  in_production: 'quality_check',
  quality_check: 'ready_to_ship',
  ready_to_ship: 'shipped',
  shipped: 'in_transit',
  in_transit: 'delivered',
  delivered: 'completed',
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
  quotationId: '',
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
  paymentTerms: 'T/T 30% deposit, 70% before shipment',
  deliveryTerms: 'FOB Zhoushan',
  shippingMethod: '',
  trackingNumber: '',
  shippingAddress: '',
  notes: '',
  items: [{ ...EMPTY_ITEM }],
};

// ─── Currency formatting ─────────────────────────────────────

function fmtCurrency(amount: number, currency: string = 'USD'): string {
  const sym: Record<string, string> = { USD: '$', EUR: '€', CNY: '¥', JPY: '¥', GBP: '£' };
  return `${sym[currency] ?? currency + ' '}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtDateTime(d: string): string {
  return new Date(d).toLocaleString('zh-CN');
}

// ─── Main Component ──────────────────────────────────────────

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active view tab
  const [activeView, setActiveView] = useState<'orders' | 'analytics'>('orders');

  // List state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  // Status update state
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState('');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Tracking state
  const [trackingInfo, setTrackingInfo] = useState<Record<string, TrackingInfo>>({});

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ─── Data Fetching ───────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      });
      const res = await fetch(`/api/admin/orders?${qs}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/admin/orders/analytics');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAnalytics(data);
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchTracking = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/tracking`);
      if (!res.ok) return;
      const data = await res.json();
      setTrackingInfo((prev) => ({ ...prev, [orderId]: data }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (activeView === 'analytics') fetchAnalytics();
  }, [activeView, fetchAnalytics]);

  // Handle fromQuotation parameter
  useEffect(() => {
    const fromQuotation = searchParams.get('fromQuotation');
    if (fromQuotation) {
      loadFromQuotation(fromQuotation);
      // Clean URL
      router.replace(window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFromQuotation = async (quotationId: string) => {
    try {
      const res = await fetch(`/api/admin/quotations/${quotationId}`);
      if (!res.ok) throw new Error('Failed to load quotation');
      const q = await res.json();
      setForm({
        ...INITIAL_FORM,
        quotationId: q.id,
        inquiryId: q.inquiryId || '',
        customerId: q.customerId || '',
        contactName: q.contactName,
        companyName: q.companyName,
        email: q.email,
        phone: q.phone || '',
        country: q.country || '',
        currency: q.currency || 'USD',
        discount: q.discount || 0,
        tax: q.tax || 0,
        shippingCost: q.shippingCost || 0,
        paymentTerms: q.paymentTerms || '',
        deliveryTerms: q.deliveryTerms || '',
        notes: `从报价单 ${q.quotationNumber} 转换`,
        items: q.items.map((it: OrderItem) => ({
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
    } catch {
      toast.error('加载报价单失败');
    }
  };

  // ─── Form Helpers ────────────────────────────────────────

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

  const calcSubtotal = () =>
    form.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const calcGrandTotal = () =>
    calcSubtotal() - form.discount + form.tax + form.shippingCost;

  // ─── Actions ─────────────────────────────────────────────

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
          .map((it) => ({ ...it, productId: it.productId || null })),
      };

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success('订单已创建');
      setShowModal(false);
      setForm({ ...INITIAL_FORM });
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, note: string) => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, statusNote: note }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(`状态已更新为 ${STATUS_LABELS[newStatus] || newStatus}`);
      setStatusUpdateId(null);
      setStatusUpdateTarget('');
      setStatusUpdateNote('');
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setStatusUpdating(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-primary-600" />
            订单管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理订单、物流跟踪与数据分析</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setActiveView('orders')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Package className="w-4 h-4 inline-block mr-1" />
              订单列表
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-1" />
              数据分析
            </button>
          </div>
          <button
            onClick={() => { if (activeView === 'orders') { fetchOrders(); } else { fetchAnalytics(); } }}
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setForm({ ...INITIAL_FORM }); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新建订单
          </button>
        </div>
      </div>

      {activeView === 'orders' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、公司、邮箱、快递单号..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? TAB_COLORS[s] || 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {STATUS_LABELS[s] || s}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-10 px-4 py-3"></th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">订单号</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">公司</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">联系人</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">总金额</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">状态</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">物流方式</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">快递单号</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">创建时间</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-20 text-gray-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        加载中...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-20 text-gray-400">
                        暂无订单
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        expanded={expandedId === order.id}
                        onToggle={() => {
                          const shouldExpand = expandedId !== order.id;
                          setExpandedId(shouldExpand ? order.id : null);
                          if (shouldExpand && order.trackingNumber && order.shippingMethod) {
                            fetchTracking(order.id);
                          }
                        }}
                        trackingInfo={trackingInfo[order.id]}
                        onStatusUpdate={(target) => {
                          setStatusUpdateId(order.id);
                          setStatusUpdateTarget(target);
                          setStatusUpdateNote('');
                        }}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <span className="text-sm text-gray-600">
                  共 {total} 条，第 {page}/{totalPages} 页
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-100"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <AnalyticsDashboard analytics={analytics} loading={analyticsLoading} />
      )}

      {/* Status Update Modal */}
      {statusUpdateId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">更新订单状态</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标状态</label>
                <select
                  value={statusUpdateTarget}
                  onChange={(e) => setStatusUpdateTarget(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(STATUS_LABELS)
                    .filter(([k]) => k !== 'all')
                    .map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                <textarea
                  value={statusUpdateNote}
                  onChange={(e) => setStatusUpdateNote(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="输入状态变更备注..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setStatusUpdateId(null); setStatusUpdateTarget(''); setStatusUpdateNote(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleStatusUpdate(statusUpdateId, statusUpdateTarget, statusUpdateNote)}
                disabled={statusUpdating || !statusUpdateTarget}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {statusUpdating ? '更新中...' : '确认更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
          <div className="bg-white rounded-xl w-full max-w-4xl mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">新建订单</h2>
              <button
                onClick={() => { setShowModal(false); setForm({ ...INITIAL_FORM }); }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">客户信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">联系人 *</label>
                    <input
                      value={form.contactName}
                      onChange={(e) => updateField('contactName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">公司 *</label>
                    <input
                      value={form.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">邮箱 *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">电话</label>
                    <input
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">国家</label>
                    <input
                      value={form.country}
                      onChange={(e) => updateField('country', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">币种</label>
                    <select
                      value={form.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
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
                <h3 className="text-sm font-semibold text-gray-800 mb-3">产品明细</h3>
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <label className="block text-xs text-gray-500 mb-1">产品名称</label>
                          <input
                            value={item.productName}
                            onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            placeholder="产品名称"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">SKU</label>
                          <input
                            value={item.sku}
                            onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">数量</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-500 mb-1">单位</label>
                          <input
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">单价</label>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="col-span-1 text-right text-sm font-medium text-gray-700 pb-1.5">
                          {fmtCurrency(item.quantity * item.unitPrice, form.currency)}
                        </div>
                        <div className="col-span-1 text-right pb-1">
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30"
                            disabled={form.items.length <= 1}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <input
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-600"
                          placeholder="描述（可选）"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-3 flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  添加产品
                </button>
              </div>

              {/* Shipping & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-800">条款 & 物流</h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">付款条款</label>
                    <input
                      value={form.paymentTerms}
                      onChange={(e) => updateField('paymentTerms', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">交货条款</label>
                    <input
                      value={form.deliveryTerms}
                      onChange={(e) => updateField('deliveryTerms', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">物流方式</label>
                    <select
                      value={form.shippingMethod}
                      onChange={(e) => updateField('shippingMethod', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">请选择</option>
                      {Object.entries(SHIPPING_METHODS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">快递单号</label>
                    <input
                      value={form.trackingNumber}
                      onChange={(e) => updateField('trackingNumber', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="如有"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">收货地址</label>
                    <textarea
                      value={form.shippingAddress}
                      onChange={(e) => updateField('shippingAddress', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">备注</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Totals */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">费用汇总</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">小计</span>
                      <span className="font-medium">{fmtCurrency(calcSubtotal(), form.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">折扣</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={form.discount}
                        onChange={(e) => updateField('discount', parseFloat(e.target.value) || 0)}
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                      />
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">税费</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={form.tax}
                        onChange={(e) => updateField('tax', parseFloat(e.target.value) || 0)}
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                      />
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">运费</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={form.shippingCost}
                        onChange={(e) => updateField('shippingCost', parseFloat(e.target.value) || 0)}
                        className="w-32 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                      />
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                      <span className="font-semibold text-gray-900">合计</span>
                      <span className="font-bold text-lg text-primary-700">{fmtCurrency(calcGrandTotal(), form.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => { setShowModal(false); setForm({ ...INITIAL_FORM }); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? '创建中...' : '创建订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Row Component ─────────────────────────────────────

function OrderRow({
  order,
  expanded,
  onToggle,
  trackingInfo,
  onStatusUpdate,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  trackingInfo?: TrackingInfo;
  onStatusUpdate: (target: string) => void;
}) {
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <>
      <tr className={`hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50/30' : ''}`}>
        {/* Expand */}
        <td className="px-4 py-3">
          <button onClick={onToggle} className="p-0.5 text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>

        {/* Order Number */}
        <td className="px-4 py-3 font-mono text-xs font-medium text-primary-700">
          {order.orderNumber}
        </td>

        {/* Company */}
        <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
          {order.companyName}
        </td>

        {/* Contact */}
        <td className="px-4 py-3 text-gray-600">{order.contactName}</td>

        {/* Grand Total */}
        <td className="px-4 py-3 text-right font-semibold text-gray-900">
          {fmtCurrency(order.grandTotal, order.currency)}
        </td>

        {/* Status */}
        <td className="px-4 py-3 text-center">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
              STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'
            }`}
          >
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </td>

        {/* Shipping Method */}
        <td className="px-4 py-3 text-center text-xs text-gray-600">
          {order.shippingMethod ? (SHIPPING_METHODS[order.shippingMethod] || order.shippingMethod) : '-'}
        </td>

        {/* Tracking */}
        <td className="px-4 py-3 text-xs">
          {order.trackingNumber ? (
            order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline flex items-center gap-1"
              >
                {order.trackingNumber}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-gray-600">{order.trackingNumber}</span>
            )
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>

        {/* Created */}
        <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(order.createdAt)}</td>

        {/* Actions */}
        <td className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            {nextStatus && (
              <button
                onClick={() => onStatusUpdate(nextStatus)}
                className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs font-medium hover:bg-primary-100 transition-colors"
                title={`推进到 ${STATUS_LABELS[nextStatus]}`}
              >
                → {STATUS_LABELS[nextStatus]}
              </button>
            )}
            <button
              onClick={() => onStatusUpdate(order.status)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              title="更改状态"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Detail */}
      {expanded && (
        <tr>
          <td colSpan={10} className="px-4 py-5 bg-gray-50/70 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Order Details */}
              <div className="space-y-3 text-sm">
                <h4 className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> 订单详情
                </h4>
                <div className="space-y-1.5 text-xs">
                  <p><span className="text-gray-500">邮箱:</span> {order.email}</p>
                  {order.phone && <p><span className="text-gray-500">电话:</span> {order.phone}</p>}
                  {order.country && <p><span className="text-gray-500">国家:</span> {order.country}</p>}
                  {order.quotation && (
                    <p><span className="text-gray-500">关联报价:</span> {order.quotation.quotationNumber}</p>
                  )}
                  <p><span className="text-gray-500">创建人:</span> {order.createdBy}</p>
                  {order.paymentTerms && <p><span className="text-gray-500">付款条款:</span> {order.paymentTerms}</p>}
                  {order.deliveryTerms && <p><span className="text-gray-500">交货条款:</span> {order.deliveryTerms}</p>}
                  {order.notes && <p><span className="text-gray-500">备注:</span> {order.notes}</p>}
                </div>

                {/* Shipping Info */}
                {(order.shippingMethod || order.shippingAddress) && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <Truck className="w-3.5 h-3.5" /> 物流信息
                    </h5>
                    <div className="text-xs space-y-1">
                      {order.shippingMethod && (
                        <p><span className="text-gray-500">物流方式:</span> {SHIPPING_METHODS[order.shippingMethod] || order.shippingMethod}</p>
                      )}
                      {order.trackingNumber && (
                        <p>
                          <span className="text-gray-500">快递单号:</span>{' '}
                          {order.trackingUrl ? (
                            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              {order.trackingNumber} <ExternalLink className="w-3 h-3 inline" />
                            </a>
                          ) : order.trackingNumber}
                        </p>
                      )}
                      {order.shippingAddress && (
                        <p className="flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                          {order.shippingAddress}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Middle: Items + Totals */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">产品明细</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-xs bg-white p-2 rounded border border-gray-100">
                      <Package className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.productName}</p>
                        {item.sku && <p className="text-gray-400">SKU: {item.sku}</p>}
                        {item.description && <p className="text-gray-500 truncate">{item.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gray-600">{item.quantity} {item.unit} × {fmtCurrency(item.unitPrice, order.currency)}</p>
                        <p className="font-medium text-gray-800">{fmtCurrency(item.total, order.currency)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">小计</span><span>{fmtCurrency(order.subtotal, order.currency)}</span></div>
                  {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">折扣</span><span className="text-red-600">-{fmtCurrency(order.discount, order.currency)}</span></div>}
                  {order.tax > 0 && <div className="flex justify-between"><span className="text-gray-500">税费</span><span>{fmtCurrency(order.tax, order.currency)}</span></div>}
                  {order.shippingCost > 0 && <div className="flex justify-between"><span className="text-gray-500">运费</span><span>{fmtCurrency(order.shippingCost, order.currency)}</span></div>}
                  <div className="flex justify-between font-semibold text-sm pt-1 border-t border-gray-100">
                    <span>合计</span>
                    <span className="text-primary-700">{fmtCurrency(order.grandTotal, order.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Right: Status History + Tracking */}
              <div className="space-y-4">
                {/* Status History Timeline */}
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4" /> 状态历史
                  </h4>
                  <div className="relative">
                    {order.statusHistory.length > 0 ? (
                      <div className="space-y-0">
                        {[...order.statusHistory].reverse().map((h, i) => (
                          <div key={h.id} className="flex gap-3 relative">
                            {/* Timeline line */}
                            {i < order.statusHistory.length - 1 && (
                              <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-gray-200" />
                            )}
                            {/* Dot */}
                            <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-0.5 border-2 ${
                              i === 0 ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'
                            }`} />
                            {/* Content */}
                            <div className="pb-4 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {h.fromStatus && (
                                  <>
                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ring-1 ring-inset ${STATUS_COLORS[h.fromStatus] || 'bg-gray-100 text-gray-600'}`}>
                                      {STATUS_LABELS[h.fromStatus] || h.fromStatus}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                  </>
                                )}
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ring-1 ring-inset ${STATUS_COLORS[h.toStatus] || 'bg-gray-100 text-gray-600'}`}>
                                  {STATUS_LABELS[h.toStatus] || h.toStatus}
                                </span>
                              </div>
                              {h.note && <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>}
                              <p className="text-[10px] text-gray-400 mt-0.5">{fmtDateTime(h.createdAt)} · {h.createdBy}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">暂无状态记录</p>
                    )}
                  </div>
                </div>

                {/* Logistics Tracking */}
                {trackingInfo && trackingInfo.events.length > 0 && (
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-1.5 mb-3">
                      <Truck className="w-4 h-4" /> 物流跟踪
                      {trackingInfo.carrierName && (
                        <span className="text-xs font-normal text-gray-500">({trackingInfo.carrierName})</span>
                      )}
                    </h4>
                    {trackingInfo.estimatedDelivery && (
                      <p className="text-xs text-gray-500 mb-2">
                        预计送达: {fmtDate(trackingInfo.estimatedDelivery)}
                      </p>
                    )}
                    <div className="space-y-0">
                      {trackingInfo.events.map((evt, i) => (
                        <div key={i} className="flex gap-3 relative">
                          {i < trackingInfo.events.length - 1 && (
                            <div className="absolute left-[5px] top-4 bottom-0 w-0.5 bg-green-200" />
                          )}
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
                            i === trackingInfo.events.length - 1 ? 'bg-green-500' : 'bg-green-200'
                          }`} />
                          <div className="pb-3 min-w-0">
                            <p className="text-xs font-medium text-gray-800">{evt.description}</p>
                            <p className="text-[10px] text-gray-400">{evt.location} · {fmtDateTime(evt.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Analytics Dashboard ─────────────────────────────────────

function AnalyticsDashboard({
  analytics,
  loading,
}: {
  analytics: AnalyticsData | null;
  loading: boolean;
}) {
  if (loading || !analytics) {
    return (
      <div className="text-center py-20 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
        加载数据分析...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          转化漏斗
        </h3>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Inquiry */}
          <div className="text-center">
            <div className="w-28 h-28 rounded-2xl bg-blue-50 border-2 border-blue-200 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-blue-700">{analytics.totals.inquiries}</p>
              <p className="text-xs text-blue-600 mt-1">询价</p>
            </div>
          </div>
          <div className="text-center">
            <ArrowRight className="w-6 h-6 text-gray-300 mx-auto" />
            <p className="text-lg font-bold text-amber-600 mt-1">{analytics.conversionRates.inquiryToQuotation}%</p>
            <p className="text-[10px] text-gray-400">转化率</p>
          </div>
          {/* Quotation */}
          <div className="text-center">
            <div className="w-28 h-28 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-amber-700">{analytics.totals.quotations}</p>
              <p className="text-xs text-amber-600 mt-1">报价</p>
            </div>
          </div>
          <div className="text-center">
            <ArrowRight className="w-6 h-6 text-gray-300 mx-auto" />
            <p className="text-lg font-bold text-green-600 mt-1">{analytics.conversionRates.quotationToOrder}%</p>
            <p className="text-[10px] text-gray-400">转化率</p>
          </div>
          {/* Order */}
          <div className="text-center">
            <div className="w-28 h-28 rounded-2xl bg-green-50 border-2 border-green-200 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-green-700">{analytics.totals.orders}</p>
              <p className="text-xs text-green-600 mt-1">订单</p>
            </div>
          </div>
          <div className="text-center">
            <ArrowRight className="w-6 h-6 text-gray-300 mx-auto" />
            <p className="text-lg font-bold text-emerald-600 mt-1">{analytics.conversionRates.orderCompletion}%</p>
            <p className="text-[10px] text-gray-400">完成率</p>
          </div>
          {/* Completed */}
          <div className="text-center">
            <div className="w-28 h-28 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-emerald-700">{analytics.totals.completedOrders}</p>
              <p className="text-xs text-emerald-600 mt-1">已完成</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">总收入（12个月）</p>
          <p className="text-2xl font-bold text-gray-900">{fmtCurrency(analytics.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">平均订单金额</p>
          <p className="text-2xl font-bold text-gray-900">{fmtCurrency(analytics.averageOrderValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">总订单数</p>
          <p className="text-2xl font-bold text-gray-900">{analytics.totals.orders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 mb-1">取消订单</p>
          <p className="text-2xl font-bold text-red-600">{analytics.totals.cancelledOrders}</p>
        </div>
      </div>

      {/* Revenue Chart + Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">月度收入（最近12个月）</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.revenueByMonth} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v: string) => {
                    const parts = v.split('-');
                    return `${parts[1]}月`;
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [fmtCurrency(Number(value)), '收入']}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label: any) => {
                    const parts = String(label).split('-');
                    return `${parts[0]}年${parts[1]}月`;
                  }}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">订单状态分布</h3>
          <div className="space-y-3">
            {analytics.statusDistribution.map((s) => {
              const total = analytics.totals.orders || 1;
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ring-1 ring-inset ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[s.status] || s.status}
                    </span>
                    <span className="text-gray-500">{s.count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {analytics.statusDistribution.length === 0 && (
              <p className="text-xs text-gray-400">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">客户排行（按订单金额）</h3>
        {analytics.topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-medium text-gray-500">排名</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">公司</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-500">邮箱</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">订单数</th>
                  <th className="text-right py-2 text-xs font-medium text-gray-500">总金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {analytics.topCustomers.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-400 font-medium">#{i + 1}</td>
                    <td className="py-2 font-medium text-gray-900">{c.companyName}</td>
                    <td className="py-2 text-gray-500">{c.email}</td>
                    <td className="py-2 text-right">{c.orderCount}</td>
                    <td className="py-2 text-right font-semibold text-primary-700">{fmtCurrency(c.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400">暂无数据</p>
        )}
      </div>
    </div>
  );
}
