'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Download,
  Loader2,
  Users,
  Globe,
  Clock,
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  Calendar,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
  Send,
  Settings,
  Eye,
  Share2,
  MessageSquare,
  X,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────

type Tab = 'visitors' | 'products' | 'charts' | 'orders';
type Period = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface VisitorRow {
  id: string;
  ip: string;
  country: string;
  device: string;
  referrer: string;
  visitCount: number;
  totalDuration: number;
  hasInquiry: boolean;
  hasSocialRedirect: boolean;
  lastVisit: string;
  firstVisit: string;
}

interface ProductRow {
  id: string;
  nameEn: string | null;
  nameZh: string | null;
  sku: string | null;
  totalViews: number;
  totalDuration: number;
  inquiryCount: number;
  shareCount: number;
}

interface OrderItem {
  productName: string;
  quantity: number;
  total: number;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  country: string | null;
  contactName: string | null;
  companyName: string | null;
  grandTotal: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface ChartsData {
  hotProducts: Array<{ name: string; count: number }>;
  countryDistribution: Array<{ country: string; count: number }>;
  inquiryTrend: Array<{ date: string; count: number }>;
  summary: { totalVisitors: number; totalInquiries: number; totalOrders: number };
}

interface ScheduleItem {
  enabled: boolean;
  frequency: string;
  email: string;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type PieLabelEntry = { name?: string | number; percent?: number };

// ── Constants ────────────────────────────────────────────────

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
];

const TABS: Array<{ key: Tab; label: string; icon: React.ReactNode }> = [
  { key: 'visitors',  label: '访客列表', icon: <Users className="w-4 h-4" /> },
  { key: 'products',  label: '产品列表', icon: <Package className="w-4 h-4" /> },
  { key: 'orders',    label: '订单列表', icon: <ShoppingCart className="w-4 h-4" /> },
  { key: 'charts',    label: '数据图', icon: <BarChart3 className="w-4 h-4" /> },
];

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'today',   label: '今天' },
  { key: 'week',    label: '本周' },
  { key: 'month',   label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year',    label: '本年' },
  { key: 'custom',  label: '自定义' },
];

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: '待处理', cls: 'bg-yellow-100 text-yellow-800' },
  confirmed:  { label: '已确认', cls: 'bg-blue-100 text-blue-800' },
  production: { label: '生产中', cls: 'bg-indigo-100 text-indigo-800' },
  shipped:    { label: '已发货', cls: 'bg-cyan-100 text-cyan-800' },
  delivered:  { label: '已交付', cls: 'bg-green-100 text-green-800' },
  cancelled:  { label: '已取消', cls: 'bg-red-100 text-red-800' },
  completed:  { label: '已完成', cls: 'bg-emerald-100 text-emerald-800' },
};

const FREQUENCY_OPTIONS: Array<{ value: string; label: string; desc: string }> = [
  { value: 'daily',     label: '每日',   desc: '每天午夜发送' },
  { value: 'weekly',    label: '每周',   desc: '每周日午夜发送' },
  { value: 'monthly',   label: '每月',   desc: '每月1日发送' },
  { value: 'quarterly', label: '每季度', desc: '每季度首日发送' },
  { value: 'yearly',    label: '每年',   desc: '每年1月1日发送' },
];

const PAGE_LIMIT = 20;

// ── Helpers ─────────────────────────────────────────────────

function maskIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip.replace(/:[\da-f]+:[\da-f]+$/, ':****');
}

function fmtDuration(seconds: number): string {
  if (seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtShortDate(d: string): string {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function parseReferrer(ref: string | null | undefined): string {
  if (!ref || ref === '' || ref === 'Direct') return '直接访问';
  try { return new URL(ref).hostname; }
  catch { return ref.length > 25 ? ref.slice(0, 25) + '…' : ref; }
}

function fmtCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const renderPieLabel = ({ name, percent }: PieLabelEntry): string => {
  const pct = (percent ?? 0) * 100;
  if (pct < 5) return '';
  return `${String(name ?? '')} ${pct.toFixed(0)}%`;
};

// ── Sub-components ─────────────────────────────────────

function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function PieLegend({ data, colors }: { data: Array<{ name: string; value: number }>; colors?: string[] }) {
  const c = colors ?? PIE_COLORS;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c[i % c.length] }} />
          {item.name}: {item.value}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon className="w-12 h-12 text-gray-300 mb-3" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  );
}

function Pagination({ page, totalPages, total, onPrev, onNext }: {
  page: number; totalPages: number; total: number;
  onPrev: () => void; onNext: () => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
      <p className="text-sm text-gray-500">第 {page} / {totalPages} 页（共 {total} 条）</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev} disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> 上一页
        </button>
        <button
          onClick={onNext} disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          下一页 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────

export default function ReportsPage() {
  // ── Core State ─────────────────
  const [tab, setTab] = useState<Tab>('visitors');
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  // ── Tab Data ──────────────────
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [visitorPages, setVisitorPages] = useState(1);
  const [visitorPage, setVisitorPage] = useState(1);

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productTotal, setProductTotal] = useState(0);
  const [productPages, setProductPages] = useState(1);
  const [productPage, setProductPage] = useState(1);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPages, setOrderPages] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  const [charts, setCharts] = useState<ChartsData | null>(null);

  // ── Schedule State ────────────
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { enabled: false, frequency: 'weekly', email: '' },
  ]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // ── Build Query String ────────
  const buildQs = useCallback((extra: Record<string, string | number> = {}): string => {
    const params: Record<string, string> = { period };
    if (period === 'custom') {
      params.from = customFrom;
      params.to = customTo;
    }
    Object.entries(extra).forEach(([k, v]) => { params[k] = String(v); });
    return new URLSearchParams(params).toString();
  }, [period, customFrom, customTo]);

  // ── API Fetches ───────────────

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs({ tab: 'visitors', page: visitorPage, limit: PAGE_LIMIT });
      const res = await fetch(`/api/admin/reports?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: PaginatedResponse<VisitorRow> = await res.json();
      setVisitors(data.items);
      setVisitorTotal(data.total);
      setVisitorPages(data.totalPages);
    } catch { setVisitors([]); }
    setLoading(false);
  }, [buildQs, visitorPage]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs({ tab: 'products', page: productPage, limit: PAGE_LIMIT });
      const res = await fetch(`/api/admin/reports?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: PaginatedResponse<ProductRow> = await res.json();
      setProducts(data.items);
      setProductTotal(data.total);
      setProductPages(data.totalPages);
    } catch { setProducts([]); }
    setLoading(false);
  }, [buildQs, productPage]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs({ tab: 'orders', page: orderPage, limit: PAGE_LIMIT });
      const res = await fetch(`/api/admin/reports?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: PaginatedResponse<OrderRow> = await res.json();
      setOrders(data.items);
      setOrderTotal(data.total);
      setOrderPages(data.totalPages);
    } catch { setOrders([]); }
    setLoading(false);
  }, [buildQs, orderPage]);

  const fetchCharts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs({ tab: 'charts' });
      const res = await fetch(`/api/admin/reports?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setCharts(await res.json());
    } catch { setCharts(null); }
    setLoading(false);
  }, [buildQs]);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reports?tab=schedule', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.schedules?.length > 0) {
        setSchedules(data.schedules.map((s: ScheduleItem) => ({
          enabled: s.enabled, frequency: s.frequency, email: s.email,
        })));
      }
    } catch { /* ignore */ }
  }, []);

  // ── Effects ───────────────────

  // Initialize date range on client to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    setCustomFrom(isoDate(new Date(now.getTime() - 30 * 86400000)));
    setCustomTo(isoDate(now));
  }, []);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  useEffect(() => {
    switch (tab) {
      case 'visitors': fetchVisitors(); break;
      case 'products': fetchProducts(); break;
      case 'orders':   fetchOrders(); break;
      case 'charts':   fetchCharts(); break;
    }
  }, [tab, fetchVisitors, fetchProducts, fetchOrders, fetchCharts]);

  // Reset page when period changes
  useEffect(() => {
    setVisitorPage(1);
    setProductPage(1);
    setOrderPage(1);
  }, [period, customFrom, customTo]);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Period Change Handler ─────
  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  // ── Export: CSV ────────────────
  const exportCsv = () => {
    const qs = buildQs({ format: 'csv' });
    window.open(`/api/admin/reports/export?${qs}`, '_blank');
    setExportOpen(false);
    toast.success('CSV 导出已开始');
  };

  // ── Export: PDF ────────────────
  const exportPdf = async () => {
    setExporting(true);
    setExportOpen(false);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageW = 297;

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('YuJiang ShipTechnology', 14, 12);
      doc.setFontSize(10);
      doc.text('Data Reports', 14, 20);
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${new Date().toLocaleString()} | Period: ${period}`, pageW - 90, 20);

      let y = 36;

      // Summary section if charts data available
      if (charts?.summary) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text('Summary', 14, y);
        y += 6;
        doc.setFontSize(9);
        doc.text(`Total Visitors: ${charts.summary.totalVisitors}`, 14, y);
        doc.text(`Total Inquiries: ${charts.summary.totalInquiries}`, 100, y);
        doc.text(`Total Orders: ${charts.summary.totalOrders}`, 190, y);
        y += 10;
      }

      // Visitors table
      if (visitors.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Visitor Data', 14, y);
        y += 2;
        autoTable(doc, {
          startY: y,
          head: [['Time', 'IP', 'Country', 'Device', 'Source', 'Visits', 'Duration', 'Inquiry', 'Social']],
          body: visitors.map(v => [
            fmtDate(v.lastVisit),
            maskIp(v.ip),
            v.country,
            v.device,
            parseReferrer(v.referrer),
            String(v.visitCount),
            fmtDuration(v.totalDuration),
            v.hasInquiry ? 'Y' : 'N',
            v.hasSocialRedirect ? 'Y' : 'N',
          ]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          theme: 'grid',
        });
      }

      // Products table
      if (products.length > 0) {
        doc.addPage();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = 20;
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text('Product Data', 14, 10);
        autoTable(doc, {
          startY: y,
          head: [['Product', 'SKU', 'Views', 'Duration', 'Inquiries', 'Shares']],
          body: products.map(p => [
            p.nameEn || p.nameZh || '-',
            p.sku || '-',
            String(p.totalViews),
            fmtDuration(p.totalDuration),
            String(p.inquiryCount),
            String(p.shareCount),
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          theme: 'grid',
        });
      }

      // Orders table
      if (orders.length > 0) {
        doc.addPage();
        y = 20;
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text('Order Data', 14, 10);
        autoTable(doc, {
          startY: y,
          head: [['Order #', 'Country', 'Customer', 'Products', 'Amount', 'Status', 'Date']],
          body: orders.map(o => [
            o.orderNumber,
            o.country || '-',
            `${o.companyName || ''} ${o.contactName || ''}`.trim() || '-',
            o.items.map(i => `${i.productName} x${i.quantity}`).join(', ') || '-',
            fmtCurrency(o.grandTotal, o.currency),
            ORDER_STATUS[o.status]?.label ?? o.status,
            fmtDate(o.createdAt),
          ]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [139, 92, 246], textColor: 255 },
          theme: 'grid',
        });
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`YuJiang ShipTechnology - Data Report - Page ${i}/${pages}`, pageW / 2, 205, { align: 'center' });
      }

      doc.save(`report-${period}-${isoDate(new Date())}.pdf`);
      toast.success('PDF 导出成功');
    } catch (err) {
      toast.error('PDF 导出失败');
      console.error(err);
    }
    setExporting(false);
  };

  // ── Save Schedule ─────────────
  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'save-schedule', schedules }),
      });
      if (!res.ok) throw new Error();
      toast.success('定时发送配置已保存');
      setScheduleOpen(false);
    } catch {
      toast.error('保存失败');
    }
    setSavingSchedule(false);
  };

  const addSchedule = () => {
    setSchedules(prev => [...prev, { enabled: false, frequency: 'weekly', email: '' }]);
  };

  const removeSchedule = (idx: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, field: keyof ScheduleItem, value: string | boolean) => {
    setSchedules(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  // ── Derived Chart Data ────────

  const hotProductsBar = (charts?.hotProducts ?? []).map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    count: p.count,
  }));

  const countryPieData = (charts?.countryDistribution ?? []).map(c => ({
    name: c.country || '未知',
    value: c.count,
  }));

  const trendLineData = (charts?.inquiryTrend ?? []).map(d => ({
    date: fmtShortDate(d.date),
    count: d.count,
  }));

  // ── Render ─────────────────────

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据报告</h1>
          <p className="text-sm text-gray-500 mt-1">全面的访客、产品、订单数据分析</p>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Schedule button */}
          <button
            onClick={() => setScheduleOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            定时发送
          </button>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              导出
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={exportPdf}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  导出 PDF
                </button>
                <button
                  onClick={exportCsv}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileText className="w-4 h-4 text-green-500" />
                  导出 Excel/CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Time Selector ═══ */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium flex-shrink-0">
            <Calendar className="w-4 h-4" />
            时间范围
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => handlePeriodChange(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  period === p.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-400 text-sm">至</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* ═══ Tab Bar ═══ */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ Loading ═══ */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-sm text-gray-500">加载数据中...</span>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          VISITORS TAB
         ════════════════════════════════════════════════════════ */}
      {tab === 'visitors' && !loading && (
        <>
          {visitors.length === 0 ? (
            <EmptyState icon={Users} text="暂无访客数据" />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">访客详细列表</h3>
                <p className="text-xs text-gray-400 mt-0.5">共 {visitorTotal} 条记录</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['时间', 'IP', '国家', '设备', '来源', '访问次数', '停留时间', '有询价', '社交来源'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((v, idx) => (
                      <tr key={v.id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(v.lastVisit)}</td>
                        <td className="px-3 py-2.5 text-xs font-mono text-gray-600">{maskIp(v.ip)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700">{v.country}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{v.device}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[160px] truncate">{parseReferrer(v.referrer)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700 font-medium text-center">{v.visitCount}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {fmtDuration(v.totalDuration)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {v.hasInquiry ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {v.hasSocialRedirect ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
                              <Share2 className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">N</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={visitorPage} totalPages={visitorPages} total={visitorTotal}
                onPrev={() => setVisitorPage(p => Math.max(1, p - 1))}
                onNext={() => setVisitorPage(p => Math.min(visitorPages, p + 1))}
              />
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          PRODUCTS TAB
         ════════════════════════════════════════════════════════ */}
      {tab === 'products' && !loading && (
        <>
          {products.length === 0 ? (
            <EmptyState icon={Package} text="暂无产品数据" />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">产品数据概览</h3>
                <p className="text-xs text-gray-400 mt-0.5">共 {productTotal} 个产品</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['产品名称', 'SKU', '总浏览', '总浏览时长', '询价次数', '分享次数'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, idx) => (
                      <tr key={p.id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium max-w-[280px]">
                          <div className="truncate">{p.nameEn || p.nameZh || '—'}</div>
                          {p.nameZh && p.nameEn && (
                            <div className="text-xs text-gray-400 truncate">{p.nameZh}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-500">{p.sku || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-gray-400" />
                            {p.totalViews}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {fmtDuration(p.totalDuration)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 ${p.inquiryCount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                            <MessageSquare className="w-3.5 h-3.5" />
                            {p.inquiryCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 ${p.shareCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                            <Share2 className="w-3.5 h-3.5" />
                            {p.shareCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={productPage} totalPages={productPages} total={productTotal}
                onPrev={() => setProductPage(p => Math.max(1, p - 1))}
                onNext={() => setProductPage(p => Math.min(productPages, p + 1))}
              />
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          CHARTS TAB
         ════════════════════════════════════════════════════════ */}
      {tab === 'charts' && !loading && (
        <>
          {/* Summary cards */}
          {charts?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: '总访客', value: charts.summary.totalVisitors, icon: Users, color: 'bg-blue-50 text-blue-600' },
                { label: '总询价', value: charts.summary.totalInquiries, icon: MessageSquare, color: 'bg-green-50 text-green-600' },
                { label: '总订单', value: charts.summary.totalOrders, icon: ShoppingCart, color: 'bg-purple-50 text-purple-600' },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className={`inline-flex p-2.5 rounded-lg ${stat.color} mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hot inquiry products bar chart */}
          <ChartCard title="询价热门产品" icon={<BarChart3 className="w-4 h-4 text-emerald-500" />}>
            {hotProductsBar.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hotProductsBar} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="询价次数" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState icon={Package} text="暂无产品询价数据" />}
          </ChartCard>

          {/* Inquiry country pie chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="询价国家分布" icon={<Globe className="w-4 h-4 text-blue-500" />}>
              {countryPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={countryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={renderPieLabel}
                        labelLine={false}
                      >
                        {countryPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={countryPieData} />
                </>
              ) : <EmptyState icon={Globe} text="暂无国家分布数据" />}
            </ChartCard>
          </div>

          {/* 30-day inquiry trend line chart */}
          <ChartCard title="询价趋势（近30天）" icon={<TrendingUp className="w-4 h-4 text-blue-500" />}>
            {trendLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                    name="询价数"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState icon={TrendingUp} text="暂无趋势数据" />}
          </ChartCard>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          ORDERS TAB
         ════════════════════════════════════════════════════════ */}
      {tab === 'orders' && !loading && (
        <>
          {orders.length === 0 ? (
            <EmptyState icon={ShoppingCart} text="暂无订单数据" />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">订单列表</h3>
                <p className="text-xs text-gray-400 mt-0.5">共 {orderTotal} 条记录</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['订单号', '国家', '客户', '产品', '金额', '状态/进度', '创建时间'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, idx) => {
                      const statusInfo = ORDER_STATUS[o.status] ?? { label: o.status, cls: 'bg-gray-100 text-gray-600' };
                      return (
                        <tr key={o.id} className={`border-b border-gray-50 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-4 py-3 text-xs font-mono text-gray-700 font-medium">{o.orderNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{o.country || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            <div className="font-medium">{o.companyName || '—'}</div>
                            {o.contactName && <div className="text-xs text-gray-400">{o.contactName}</div>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[240px]">
                            <div className="truncate">
                              {o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ') || '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">
                            {fmtCurrency(o.grandTotal, o.currency)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.cls}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={orderPage} totalPages={orderPages} total={orderTotal}
                onPrev={() => setOrderPage(p => Math.max(1, p - 1))}
                onNext={() => setOrderPage(p => Math.min(orderPages, p + 1))}
              />
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          SCHEDULE MODAL
         ════════════════════════════════════════════════════════ */}
      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setScheduleOpen(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">定时报告发送</h2>
                  <p className="text-xs text-gray-500">配置自动发送报告到指定邮箱</p>
                </div>
              </div>
              <button onClick={() => setScheduleOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {schedules.map((s, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={e => updateSchedule(idx, 'enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                      </label>
                      <span className="text-sm font-medium text-gray-700">
                        {s.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    {schedules.length > 1 && (
                      <button onClick={() => removeSchedule(idx)} className="text-gray-400 hover:text-red-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      <Mail className="w-3.5 h-3.5 inline mr-1" />
                      邮箱地址
                    </label>
                    <input
                      type="email"
                      value={s.email}
                      onChange={e => updateSchedule(idx, 'email', e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      发送频率
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {FREQUENCY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateSchedule(idx, 'frequency', opt.value)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            s.frequency === opt.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={opt.desc}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {FREQUENCY_OPTIONS.find(o => o.value === s.frequency)?.desc}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={addSchedule}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + 添加计划
              </button>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setScheduleOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={saveSchedule}
                disabled={savingSchedule}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
