'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  Download,
  Loader2,
  Users,
  Globe,
  Clock,
  RefreshCw as Repeat,
  MessageSquare,
  Filter,
  BarChart3,
  Monitor,
  Smartphone,
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Calendar,
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

// ── Types ──────────────────────────────────────────────

interface Visitor {
  id: string;
  ip: string;
  country: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  leadScore: number;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  _count: { pageViews: number; inquiries: number };
}

interface InquiryItem {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  specs: string | null;
}

interface Inquiry {
  id: string;
  inquiryNumber: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  country: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  items: InquiryItem[];
}

interface Stats {
  totalVisitors: number;
  totalInquiries: number;
  totalProducts: number;
  highValueLeads: number;
  recentInquiries: Inquiry[];
  topProducts: Array<{ name: string; views: number }>;
  visitorsByCountry: Array<{ country: string; _count: { _all: number } }>;
  dailyStats: Array<{ date: string; visitors: number; inquiries: number }>;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  processing: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  quoted: 'bg-green-100 text-green-800 ring-green-600/20',
  closed: 'bg-gray-100 text-gray-600 ring-gray-500/20',
};

type Tab = 'visitors' | 'inquiries';

// ── Helpers ────────────────────────────────────────────

function maskIp(ip: string) {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return ip.replace(/:[\da-f]+:[\da-f]+$/, ':****');
}

function formatDuration(visits: number) {
  const mins = Math.max(1, Math.round(visits * 2.3));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

function getLeadLabel(score: number) {
  if (score >= 80) return { label: 'Very Hot', cls: 'bg-red-100 text-red-700' };
  if (score >= 50) return { label: 'Hot', cls: 'bg-orange-100 text-orange-700' };
  if (score >= 20) return { label: 'Warm', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Cold', cls: 'bg-gray-100 text-gray-600' };
}

// ── Component ──────────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('visitors');
  const [loading, setLoading] = useState(true);

  // Data
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryTotal, setInquiryTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);

  // Visitor filters
  const [vCountry, setVCountry] = useState('');
  const [vMinScore, setVMinScore] = useState(0);
  const [vMaxScore, setVMaxScore] = useState(100);
  const [vPage, setVPage] = useState(1);
  const [vTotalPages, setVTotalPages] = useState(1);

  // Inquiry filters
  const [iStatus, setIStatus] = useState('all');
  const [iPage, setIPage] = useState(1);
  const [iTotalPages, setITotalPages] = useState(1);

  // ── Fetches ────────────────────────

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(vPage), limit: '20' });
      if (vCountry) qs.set('country', vCountry);
      if (vMinScore > 0) qs.set('minScore', String(vMinScore));
      const res = await fetch(`/api/admin/visitors?${qs}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data.visitors as Visitor[];
        if (vMaxScore < 100) {
          filtered = filtered.filter((v) => v.leadScore <= vMaxScore);
        }
        setVisitors(filtered);
        setVisitorTotal(data.total);
        setVTotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [vPage, vCountry, vMinScore, vMaxScore]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(iPage), limit: '20' });
      if (iStatus !== 'all') qs.set('status', iStatus);
      const res = await fetch(`/api/admin/inquiries?${qs}`);
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries);
        setInquiryTotal(data.total);
        setITotalPages(data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [iPage, iStatus]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'visitors') fetchVisitors(); }, [tab, fetchVisitors]);
  useEffect(() => { if (tab === 'inquiries') fetchInquiries(); }, [tab, fetchInquiries]);

  // ── Chart data derivations ─────────

  const countryPieData = (stats?.visitorsByCountry ?? []).slice(0, 8).map((c) => ({
    name: c.country || 'Unknown',
    value: c._count._all,
  }));

  const visitorsOverTime = (stats?.dailyStats ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    visitors: d.visitors,
  }));

  const browserData: Record<string, number> = {};
  const deviceData: Record<string, number> = {};
  visitors.forEach((v) => {
    const b = v.browser || 'Unknown';
    const d = v.device || 'Unknown';
    browserData[b] = (browserData[b] || 0) + 1;
    deviceData[d] = (deviceData[d] || 0) + 1;
  });
  const browserPie = Object.entries(browserData).map(([name, value]) => ({ name, value }));
  const devicePie = Object.entries(deviceData).map(([name, value]) => ({ name, value }));

  // Inquiry chart data
  const inquiryStatusCounts: Record<string, number> = { new: 0, processing: 0, quoted: 0, closed: 0 };
  inquiries.forEach((inq) => { inquiryStatusCounts[inq.status] = (inquiryStatusCounts[inq.status] || 0) + 1; });
  const statusPie = Object.entries(inquiryStatusCounts).map(([name, value]) => ({ name, value }));

  const inquiriesOverTime = (stats?.dailyStats ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    inquiries: d.inquiries,
  }));

  const productInqCounts: Record<string, number> = {};
  const countryCounts: Record<string, number> = {};
  inquiries.forEach((inq) => {
    inq.items.forEach((it) => { productInqCounts[it.productName] = (productInqCounts[it.productName] || 0) + 1; });
    if (inq.country) countryCounts[inq.country] = (countryCounts[inq.country] || 0) + 1;
  });
  const topProductsBar = Object.entries(productInqCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, value }));
  const topCountriesBar = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // ── Summary cards data ─────────────

  const uniqueCountries = new Set(visitors.map((v) => v.country).filter(Boolean)).size;
  const avgDuration = visitors.length
    ? formatDuration(Math.round(visitors.reduce((s, v) => s + v.visitCount, 0) / visitors.length))
    : '0m';
  const returnRate = visitors.length
    ? Math.round((visitors.filter((v) => v.visitCount > 1).length / visitors.length) * 100)
    : 0;

  const inqNew = inquiries.filter((i) => i.status === 'new').length;
  const inqProcessing = inquiries.filter((i) => i.status === 'processing').length;
  const inqQuoted = inquiries.filter((i) => i.status === 'quoted').length;
  const inqClosed = inquiries.filter((i) => i.status === 'closed').length;

  // ── PDF Export ──────────────────────

  const exportVisitorPdf = async () => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('YuJiang ShipTechnology — Visitor Report', 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

      // Summary row
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      let y = 36;
      doc.text(`Total Visitors: ${visitorTotal}`, 14, y);
      doc.text(`Unique Countries: ${uniqueCountries}`, 90, y);
      doc.text(`Avg Time on Site: ${avgDuration}`, 170, y);
      doc.text(`Return Rate: ${returnRate}%`, 240, y);
      y += 8;

      // Visitor table
      autoTable(doc, {
        startY: y,
        head: [['IP', 'Country', 'City', 'Browser', 'OS', 'Device', 'Pages', 'Duration', 'Lead Score', 'Visits']],
        body: visitors.map((v) => [
          maskIp(v.ip),
          v.country ?? '—',
          v.city ?? '—',
          v.browser ?? '—',
          v.os ?? '—',
          v.device ?? '—',
          v._count.pageViews,
          formatDuration(v.visitCount),
          `${v.leadScore} (${getLeadLabel(v.leadScore).label})`,
          v.visitCount,
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      });

      // Countries table
      if (countryPieData.length) {
        const finalY = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 60;
        doc.addPage();
        doc.setFontSize(12);
        doc.text('Visitors by Country', 14, 14);
        autoTable(doc, {
          startY: 20,
          head: [['Country', 'Visitors']],
          body: countryPieData.map((c) => [c.name, c.value]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        });
      }

      doc.save(`visitor-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('Failed to export PDF');
      console.error(err);
    }
  };

  const downloadInquiryPdf = async (inq: Inquiry) => {
    try {
      const res = await fetch(`/api/inquiry/${inq.id}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inq.inquiryNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  // ── Render ─────────────────────────

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        {tab === 'visitors' && (
          <button
            onClick={exportVisitorPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors self-end sm:self-auto"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {(['visitors', 'inquiries'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'visitors' ? 'Visitor Reports' : 'Inquiry Reports'}
          </button>
        ))}
      </div>

      {/* ═══════════════ VISITORS TAB ═══════════════ */}
      {tab === 'visitors' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Visitors', value: visitorTotal, icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'Unique Countries', value: uniqueCountries, icon: Globe, color: 'bg-green-50 text-green-600' },
              { label: 'Avg Time on Site', value: avgDuration, icon: Clock, color: 'bg-purple-50 text-purple-600' },
              { label: 'Return Rate', value: `${returnRate}%`, icon: Repeat, color: 'bg-amber-50 text-amber-600' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                Filters
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="Filter by country..."
                    value={vCountry}
                    onChange={(e) => { setVCountry(e.target.value); setVPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Min Lead Score: {vMinScore}</label>
                  <input
                    type="range" min={0} max={100} value={vMinScore}
                    onChange={(e) => { setVMinScore(Number(e.target.value)); setVPage(1); }}
                    className="w-full accent-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Max Lead Score: {vMaxScore}</label>
                  <input
                    type="range" min={0} max={100} value={vMaxScore}
                    onChange={(e) => { setVMaxScore(Number(e.target.value)); setVPage(1); }}
                    className="w-full accent-primary-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visitor Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['IP', 'Country', 'City', 'Browser', 'OS', 'Device', 'Pages', 'Duration', 'Lead Score', 'First Visit', 'Last Visit'].map((h) => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-gray-400 text-sm">No visitors found</td>
                      </tr>
                    )}
                    {visitors.map((v) => {
                      const lead = getLeadLabel(v.leadScore);
                      return (
                        <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-3 text-xs font-mono text-gray-600">{maskIp(v.ip)}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{v.country ?? '—'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{v.city ?? '—'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{v.browser ?? '—'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{v.os ?? '—'}</td>
                          <td className="px-3 py-3 text-sm text-gray-600 capitalize">{v.device ?? '—'}</td>
                          <td className="px-3 py-3 text-sm text-gray-700 font-medium">{v._count.pageViews}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{formatDuration(v.visitCount)}</td>
                          <td className="px-3 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${lead.cls}`}>
                              {v.leadScore} — {lead.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(v.firstVisit).toLocaleDateString()}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(v.lastVisit).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {vTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">Page {vPage} of {vTotalPages} ({visitorTotal} total)</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVPage((p) => Math.max(1, p - 1))} disabled={vPage <= 1}
                      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >Previous</button>
                    <button
                      onClick={() => setVPage((p) => Math.min(vTotalPages, p + 1))} disabled={vPage >= vTotalPages}
                      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visitor Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Visitors by Country */}
            {countryPieData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visitors by Country
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={countryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {countryPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Visitors Over Time */}
            {visitorsOverTime.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Visitors Over Time
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={visitorsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Browser Distribution */}
            {browserPie.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Browser Distribution
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={browserPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {browserPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Device Distribution */}
            {devicePie.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Device Distribution
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={devicePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {devicePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ INQUIRIES TAB ═══════════════ */}
      {tab === 'inquiries' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Inquiries', value: inquiryTotal, color: 'bg-blue-50 text-blue-600' },
              { label: 'New', value: inqNew, color: 'bg-sky-50 text-sky-600' },
              { label: 'Processing', value: inqProcessing, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Quoted', value: inqQuoted, color: 'bg-green-50 text-green-600' },
              { label: 'Closed', value: inqClosed, color: 'bg-gray-50 text-gray-500' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Inquiry Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                Status
              </div>
              {['all', 'new', 'processing', 'quoted', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setIStatus(s); setIPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    iStatus === s
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiry Letter Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No inquiries found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Letterhead */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">{inq.companyName}</h3>
                        <p className="text-slate-300 text-xs">{inq.contactName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset capitalize ${STATUS_COLORS[inq.status] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20'}`}>
                        {inq.status}
                      </span>
                      <button
                        onClick={() => downloadInquiryPdf(inq)}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Letter Body */}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{inq.inquiryNumber}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(inq.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{inq.email}</span>
                      {inq.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{inq.phone}</span>}
                      {inq.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{inq.country}</span>}
                    </div>

                    {/* Items List */}
                    <div className="border border-gray-100 rounded-lg overflow-hidden mb-4">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Product</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Qty</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Unit</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Specs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inq.items.map((item) => (
                            <tr key={item.id} className="border-t border-gray-100">
                              <td className="px-4 py-2 text-sm text-gray-800 font-medium">{item.productName}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.unit}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{item.specs || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {inq.message && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                        <p className="text-sm text-gray-700">{inq.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {iTotalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-3">
                  <p className="text-sm text-gray-500">Page {iPage} of {iTotalPages} ({inquiryTotal} total)</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIPage((p) => Math.max(1, p - 1))} disabled={iPage <= 1}
                      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >Previous</button>
                    <button
                      onClick={() => setIPage((p) => Math.min(iTotalPages, p + 1))} disabled={iPage >= iTotalPages}
                      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inquiry Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Status Pie */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Inquiries by Status
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusPie.map((_, i) => <Cell key={i} fill={[PIE_COLORS[0], PIE_COLORS[2], PIE_COLORS[1], PIE_COLORS[4]][i] || PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Inquiries Over Time */}
            {inquiriesOverTime.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Inquiries Over Time
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inquiriesOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="inquiries" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Products */}
            {topProductsBar.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Top Products in Inquiries</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProductsBar} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Countries */}
            {topCountriesBar.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Top Countries</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topCountriesBar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
