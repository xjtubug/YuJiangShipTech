# -*- coding: utf-8 -*-
"""Generate the reports page with proper CJK characters."""
import os

FILE_PATH = os.path.join(os.path.dirname(__file__), 'src', 'app', '[locale]', 'admin', 'reports', 'page.tsx')

content = """\
'use client';

import { useEffect, useState, useCallback, Fragment, type ReactNode } from 'react';
import {
  FileText,
  Download,
  Loader2,
  Users,
  Globe,
  Clock,
  RefreshCw,
  MessageSquare,
  Filter,
  BarChart3,
  Monitor,
  Smartphone,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Star,
  TrendingUp,
  Laptop,
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

// \u2500\u2500 Types \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

interface Visitor {
  id: string;
  ip: string;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  language: string | null;
  referrer: string | null;
  leadScore: number;
  isHighValue: boolean;
  visitCount: number;
  firstVisit: string;
  lastVisit: string;
  _count: { pageViews: number; inquiries: number };
}

interface InquiryFollowUp {
  id: string;
  action: string;
  content: string;
  createdBy: string;
  createdAt: string;
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
  techRequirements: string | null;
  status: string;
  createdAt: string;
  items: InquiryItem[];
  followUps?: InquiryFollowUp[];
}

interface TopProduct {
  nameEn?: string;
  nameZh?: string;
  viewCount: number;
}

interface Stats {
  totalVisitors: number;
  totalInquiries: number;
  totalProducts: number;
  highValueLeads: number;
  topProducts: TopProduct[];
  visitorsByCountry: Array<{ country: string; count: number }>;
  chartData: Array<{ date: string; visitors: number; inquiries: number }>;
}

type PieLabelEntry = { name?: string | number; percent?: number };
type Tab = 'visitors' | 'inquiries';

// \u2500\u2500 Constants \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const PIE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6',
];

const STATUS_MAP: Record<string, { label: string; cls: string; color: string }> = {
  new:        { label: '\u65b0\u8be2\u4ef7', cls: 'bg-blue-100 text-blue-800 ring-blue-600/20',     color: '#3b82f6' },
  processing: { label: '\u5904\u7406\u4e2d', cls: 'bg-yellow-100 text-yellow-800 ring-yellow-600/20', color: '#f59e0b' },
  quoted:     { label: '\u5df2\u62a5\u4ef7', cls: 'bg-green-100 text-green-800 ring-green-600/20',   color: '#10b981' },
  closed:     { label: '\u5df2\u5173\u95ed', cls: 'bg-gray-100 text-gray-600 ring-gray-500/20',     color: '#6b7280' },
};

const ACTION_MAP: Record<string, { label: string; icon: string }> = {
  call:       { label: '\u7535\u8bdd\u8054\u7cfb', icon: '\U0001f4de' },
  email:      { label: '\u90ae\u4ef6\u6c9f\u901a', icon: '\u2709\ufe0f' },
  meeting:    { label: '\u4f1a\u8bae',     icon: '\U0001f465' },
  note:       { label: '\u5907\u6ce8',     icon: '\U0001f4dd' },
  quote_sent: { label: '\u5df2\u53d1\u62a5\u4ef7', icon: '\U0001f4e4' },
};

const LEAD_COLORS = {
  cold:    { label: '\u51b7\u7ebf\u7d22',   cls: 'bg-gray-100 text-gray-600',    color: '#9ca3af' },
  warm:    { label: '\u6e29\u7ebf\u7d22',   cls: 'bg-amber-100 text-amber-700',  color: '#f59e0b' },
  hot:     { label: '\u70ed\u7ebf\u7d22',   cls: 'bg-orange-100 text-orange-700', color: '#f97316' },
  veryHot: { label: '\u6781\u70ed\u7ebf\u7d22', cls: 'bg-red-100 text-red-700',      color: '#ef4444' },
};

// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function maskIp(ip: string) {
  const parts = ip.split('.');
  if (parts.length === 4) return `${'$'}{parts[0]}.${'$'}{parts[1]}.*.*`;
  return ip.replace(/:[\\da-f]+:[\\da-f]+$/, ':****');
}

function formatDuration(visits: number) {
  const mins = Math.max(1, Math.round(visits * 2.3));
  return mins >= 60 ? `${'$'}{Math.floor(mins / 60)}h ${'$'}{mins % 60}m` : `${'$'}{mins}m`;
}

function getLeadLabel(score: number) {
  if (score >= 81) return LEAD_COLORS.veryHot;
  if (score >= 51) return LEAD_COLORS.hot;
  if (score >= 21) return LEAD_COLORS.warm;
  return LEAD_COLORS.cold;
}

function getLeadCategory(score: number): keyof typeof LEAD_COLORS {
  if (score >= 81) return 'veryHot';
  if (score >= 51) return 'hot';
  if (score >= 21) return 'warm';
  return 'cold';
}

function parseReferrer(ref: string | null): string {
  if (!ref || ref === '') return '\u76f4\u63a5\u8bbf\u95ee';
  try { return new URL(ref).hostname; }
  catch { return ref.length > 30 ? ref.slice(0, 30) + '\u2026' : ref; }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtShortDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

const renderPieLabel = ({ name, percent }: PieLabelEntry): string => {
  const pct = (percent ?? 0) * 100;
  if (pct < 5) return '';
  return `${'$'}{String(name ?? '')} ${'$'}{pct.toFixed(0)}%`;
};
"""

# Now fix the template literal issue: replace ${'$'} with just $
content = content.replace("${'$'}", "$")

# Continue with sub-components and main component
rest = r"""
// ── Sub-components ─────────────────────────────────────

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

function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
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

// ── Main Component ─────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('visitors');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorTotal, setVisitorTotal] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryTotal, setInquiryTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [expandedInquiries, setExpandedInquiries] = useState<Set<string>>(new Set());

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

  const toggleExpand = (id: string) => {
    setExpandedInquiries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
      const qs = new URLSearchParams({ page: String(vPage), limit: '50' });
      if (vCountry) qs.set('country', vCountry);
      if (vMinScore > 0) qs.set('minScore', String(vMinScore));
      const res = await fetch(`/api/admin/visitors?${qs}`);
      if (res.ok) {
        const data = await res.json();
        let filtered = data.visitors as Visitor[];
        if (vMaxScore < 100) filtered = filtered.filter(v => v.leadScore <= vMaxScore);
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
      const qs = new URLSearchParams({ page: String(iPage), limit: '50', includeFollowUps: 'true' });
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

  // ── Chart Data Derivations ─────────

  const countryPieData = (stats?.visitorsByCountry ?? []).slice(0, 8).map(c => ({
    name: c.country || '未知', value: c.count,
  }));

  const countryBarData = (stats?.visitorsByCountry ?? []).slice(0, 10).map(c => ({
    name: c.country || '未知', value: c.count,
  }));

  const visitorsOverTime = (stats?.chartData ?? []).map(d => ({
    date: fmtShortDate(d.date), visitors: d.visitors,
  }));

  const referrerCounts: Record<string, number> = {};
  visitors.forEach(v => {
    const ref = parseReferrer(v.referrer);
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const referrerPie = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const browserCounts: Record<string, number> = {};
  const osCounts: Record<string, number> = {};
  const deviceCounts: Record<string, number> = {};
  visitors.forEach(v => {
    browserCounts[v.browser || '未知'] = (browserCounts[v.browser || '未知'] || 0) + 1;
    osCounts[v.os || '未知'] = (osCounts[v.os || '未知'] || 0) + 1;
    deviceCounts[v.device || '未知'] = (deviceCounts[v.device || '未知'] || 0) + 1;
  });
  const browserPie = Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const osPie = Object.entries(osCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  const devicePie = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  const leadDist = { cold: 0, warm: 0, hot: 0, veryHot: 0 };
  visitors.forEach(v => { leadDist[getLeadCategory(v.leadScore)]++; });
  const leadScorePie = [
    { name: '冷线索 (0-20)',  value: leadDist.cold },
    { name: '温线索 (21-50)', value: leadDist.warm },
    { name: '热线索 (51-80)', value: leadDist.hot },
    { name: '极热线索 (81+)', value: leadDist.veryHot },
  ].filter(d => d.value > 0);
  const leadScoreColors = ['#9ca3af', '#f59e0b', '#f97316', '#ef4444'];

  const topPages = (stats?.topProducts ?? []).slice(0, 10).map(p => ({
    name: p.nameZh || p.nameEn || '未知产品', views: p.viewCount,
  }));

  // Inquiry charts
  const inquiryStatusCounts: Record<string, number> = { new: 0, processing: 0, quoted: 0, closed: 0 };
  inquiries.forEach(inq => {
    inquiryStatusCounts[inq.status] = (inquiryStatusCounts[inq.status] || 0) + 1;
  });
  const statusPie = Object.entries(inquiryStatusCounts).map(([key, value]) => ({
    name: STATUS_MAP[key]?.label ?? key, value,
  }));
  const statusPieColors = Object.keys(inquiryStatusCounts).map(k => STATUS_MAP[k]?.color ?? '#6b7280');

  const inquiriesOverTime = (stats?.chartData ?? []).map(d => ({
    date: fmtShortDate(d.date), inquiries: d.inquiries,
  }));

  const productInqCounts: Record<string, number> = {};
  const inqCountryCounts: Record<string, number> = {};
  inquiries.forEach(inq => {
    inq.items.forEach(it => {
      productInqCounts[it.productName] = (productInqCounts[it.productName] || 0) + 1;
    });
    if (inq.country) inqCountryCounts[inq.country] = (inqCountryCounts[inq.country] || 0) + 1;
  });
  const topProductsBar = Object.entries(productInqCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, value }));
  const inqCountryPie = Object.entries(inqCountryCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, value]) => ({ name, value }));
  const inqCountryBar = Object.entries(inqCountryCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // ── Summary Stats ──────────────────

  const uniqueCountries = new Set(visitors.map(v => v.country).filter(Boolean)).size;
  const avgDuration = visitors.length
    ? formatDuration(Math.round(visitors.reduce((s, v) => s + v.visitCount, 0) / visitors.length))
    : '0m';
  const returnRate = visitors.length
    ? Math.round((visitors.filter(v => v.visitCount > 1).length / visitors.length) * 100)
    : 0;

  const inqNew = inquiries.filter(i => i.status === 'new').length;
  const inqProcessing = inquiries.filter(i => i.status === 'processing').length;
  const inqQuoted = inquiries.filter(i => i.status === 'quoted').length;
  const inqClosed = inquiries.filter(i => i.status === 'closed').length;

  // ── PDF Export: Visitor Report ─────

  const exportVisitorPdf = async () => {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageW = 297;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('YuJiang ShipTechnology', 14, 14);
      doc.setFontSize(11);
      doc.text('Visitor Analytics Report', 14, 22);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 70, 22);

      let y = 38;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Summary', 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.text(`Total Visitors: ${visitorTotal}`, 14, y);
      doc.text(`Unique Countries: ${uniqueCountries}`, 85, y);
      doc.text(`Avg. Session Duration: ${avgDuration}`, 160, y);
      doc.text(`Return Rate: ${returnRate}%`, 245, y);
      y += 10;

      doc.setFontSize(12);
      doc.text('Lead Score Distribution', 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Category', 'Count', 'Percentage']],
        body: [
          ['Cold (0-20)',     String(leadDist.cold),    `${visitors.length ? ((leadDist.cold / visitors.length) * 100).toFixed(1) : 0}%`],
          ['Warm (21-50)',    String(leadDist.warm),    `${visitors.length ? ((leadDist.warm / visitors.length) * 100).toFixed(1) : 0}%`],
          ['Hot (51-80)',     String(leadDist.hot),     `${visitors.length ? ((leadDist.hot / visitors.length) * 100).toFixed(1) : 0}%`],
          ['Very Hot (81+)', String(leadDist.veryHot),  `${visitors.length ? ((leadDist.veryHot / visitors.length) * 100).toFixed(1) : 0}%`],
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        theme: 'grid',
      });

      if (countryPieData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = ((doc as any).lastAutoTable?.finalY ?? y) + 10;
        doc.setFontSize(12);
        doc.text('Country Distribution', 14, y);
        y += 2;
        autoTable(doc, {
          startY: y,
          head: [['Country', 'Visitors', 'Percentage']],
          body: countryPieData.map(c => {
            const total = countryPieData.reduce((s, x) => s + x.value, 0);
            return [c.name, String(c.value), `${total ? ((c.value / total) * 100).toFixed(1) : 0}%`];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          theme: 'grid',
        });
      }

      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('Visitor Details', 14, 10);

      autoTable(doc, {
        startY: 20,
        head: [['IP', 'Country', 'City', 'Browser', 'OS', 'Device', 'Pages', 'Duration', 'Lead Score', 'First Visit', 'Last Visit']],
        body: visitors.map(v => [
          maskIp(v.ip),
          v.country ?? '-',
          v.city ?? '-',
          v.browser ?? '-',
          v.os ?? '-',
          v.device ?? '-',
          String(v._count.pageViews),
          formatDuration(v.visitCount),
          `${v.leadScore} (${getLeadLabel(v.leadScore).label})`,
          fmtDate(v.firstVisit),
          fmtDate(v.lastVisit),
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        theme: 'grid',
      });

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`YuJiang ShipTechnology - Visitor Report - Page ${i}/${pages}`, pageW / 2, 205, { align: 'center' });
      }

      doc.save(`visitor-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('访客报告 PDF 导出成功');
    } catch (err) {
      toast.error('PDF 导出失败');
      console.error(err);
    }
    setExporting(false);
  };

  // ── PDF Export: Inquiry Report ─────

  const exportInquiryPdf = async () => {
    setExporting(true);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageW = 297;

      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text('YuJiang ShipTechnology', 14, 14);
      doc.setFontSize(11);
      doc.text('Inquiry Analytics Report', 14, 22);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 70, 22);

      let y = 38;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('Summary', 14, y);
      y += 7;
      doc.setFontSize(9);
      doc.text(`Total Inquiries: ${inquiryTotal}`, 14, y);
      doc.text(`New: ${inqNew}`, 85, y);
      doc.text(`Processing: ${inqProcessing}`, 125, y);
      doc.text(`Quoted: ${inqQuoted}`, 175, y);
      doc.text(`Closed: ${inqClosed}`, 225, y);
      y += 10;

      doc.setFontSize(12);
      doc.text('Customer Contact Information', 14, y);
      y += 2;
      autoTable(doc, {
        startY: y,
        head: [['Company', 'Contact', 'Email', 'Phone', 'Country']],
        body: inquiries.map(inq => [
          inq.companyName, inq.contactName, inq.email, inq.phone ?? '-', inq.country ?? '-',
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        theme: 'grid',
      });

      if (topProductsBar.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = ((doc as any).lastAutoTable?.finalY ?? y) + 10;
        if (y > 170) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Product Inquiry Frequency', 14, y);
        y += 2;
        autoTable(doc, {
          startY: y,
          head: [['Product', 'Inquiry Count']],
          body: topProductsBar.map(p => [p.name, String(p.value)]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [16, 185, 129], textColor: 255 },
          theme: 'grid',
        });
      }

      doc.addPage();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageW, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text('Inquiry Details', 14, 10);

      autoTable(doc, {
        startY: 20,
        head: [['#', 'Company', 'Contact', 'Email', 'Phone', 'Country', 'Products', 'Status', 'Date']],
        body: inquiries.map(inq => [
          inq.inquiryNumber,
          inq.companyName,
          inq.contactName,
          inq.email,
          inq.phone ?? '-',
          inq.country ?? '-',
          inq.items.map(it => `${it.productName} x${it.quantity}`).join(', ') || '-',
          STATUS_MAP[inq.status]?.label ?? inq.status,
          fmtDate(inq.createdAt),
        ]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        theme: 'grid',
      });

      const allFollowUps = inquiries.flatMap(inq =>
        (inq.followUps ?? []).map(fu => ({ inquiryNumber: inq.inquiryNumber, company: inq.companyName, ...fu }))
      );
      if (allFollowUps.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y = ((doc as any).lastAutoTable?.finalY ?? 20) + 10;
        if (y > 170) { doc.addPage(); y = 20; }
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text('Follow-up Tracking', 14, y);
        y += 2;
        autoTable(doc, {
          startY: y,
          head: [['Inquiry #', 'Company', 'Action', 'Content', 'Created By', 'Date']],
          body: allFollowUps.map(fu => [
            fu.inquiryNumber,
            fu.company,
            ACTION_MAP[fu.action]?.label ?? fu.action,
            fu.content.length > 60 ? fu.content.slice(0, 60) + '...' : fu.content,
            fu.createdBy,
            fmtDate(fu.createdAt),
          ]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [245, 158, 11], textColor: 255 },
          theme: 'grid',
        });
      }

      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`YuJiang ShipTechnology - Inquiry Report - Page ${i}/${pages}`, pageW / 2, 205, { align: 'center' });
      }

      doc.save(`inquiry-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('询价报告 PDF 导出成功');
    } catch (err) {
      toast.error('PDF 导出失败');
      console.error(err);
    }
    setExporting(false);
  };

  // ── Render ─────────────────────────

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据报告</h1>
          <p className="text-sm text-gray-500 mt-1">全面的访客与询价数据分析</p>
        </div>
        <button
          onClick={tab === 'visitors' ? exportVisitorPdf : exportInquiryPdf}
          disabled={exporting || loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 self-end sm:self-auto"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? '导出中...' : '导出 PDF 报告'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'visitors' as Tab, label: '访客报告', icon: <Users className="w-4 h-4" /> },
          { key: 'inquiries' as Tab, label: '询价报告', icon: <MessageSquare className="w-4 h-4" /> },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-sm text-gray-500">加载数据中...</span>
        </div>
      )}

      {/* ═══════════ VISITOR TAB ═══════════ */}
      {tab === 'visitors' && !loading && (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '总访客数',     value: visitorTotal,     icon: Users,     color: 'bg-blue-50 text-blue-600' },
              { label: '独立国家数',   value: uniqueCountries,  icon: Globe,     color: 'bg-green-50 text-green-600' },
              { label: '平均停留时间', value: avgDuration,      icon: Clock,     color: 'bg-purple-50 text-purple-600' },
              { label: '回访率',       value: `${returnRate}%`, icon: RefreshCw, color: 'bg-amber-50 text-amber-600' },
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

          {/* 来源分析 + 地区分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="来源分析" icon={<LinkIcon className="w-4 h-4 text-blue-500" />}>
              {referrerPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={referrerPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {referrerPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={referrerPie} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无来源数据</p>}
            </ChartCard>

            <ChartCard title="地区分析" icon={<Globe className="w-4 h-4 text-green-500" />}>
              {countryPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={countryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {countryPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={countryPieData} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无地区数据</p>}
            </ChartCard>
          </div>

          {/* 浏览器 + 操作系统 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="浏览器分布" icon={<Monitor className="w-4 h-4 text-indigo-500" />}>
              {browserPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={browserPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {browserPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={browserPie} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无浏览器数据</p>}
            </ChartCard>

            <ChartCard title="操作系统分布" icon={<Laptop className="w-4 h-4 text-cyan-500" />}>
              {osPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={osPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {osPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={osPie} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无操作系统数据</p>}
            </ChartCard>
          </div>

          {/* 设备类型 + 线索评分 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="设备类型分布" icon={<Smartphone className="w-4 h-4 text-pink-500" />}>
              {devicePie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={devicePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {devicePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={devicePie} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无设备数据</p>}
            </ChartCard>

            <ChartCard title="线索评分分布" icon={<Star className="w-4 h-4 text-amber-500" />}>
              {leadScorePie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={leadScorePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {leadScorePie.map((_, i) => <Cell key={i} fill={leadScoreColors[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={leadScorePie} colors={leadScoreColors} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无线索数据</p>}
            </ChartCard>
          </div>

          {/* 30天访客趋势 */}
          <ChartCard title="30天访客趋势" icon={<TrendingUp className="w-4 h-4 text-blue-500" />}>
            {visitorsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={visitorsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="访客数" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 py-12 text-center">暂无趋势数据</p>}
          </ChartCard>

          {/* 国家分布条形图 */}
          {countryBarData.length > 0 && (
            <ChartCard title="国家访客分布" icon={<BarChart3 className="w-4 h-4 text-green-500" />}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={countryBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="访客数" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* 热门浏览内容 */}
          {topPages.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  热门浏览内容
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">排名</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">产品名称</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500">浏览次数</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page, i) => (
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm">
                        <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold ${
                          i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>{i + 1}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-800 font-medium">{page.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 text-right font-mono">{page.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 筛选器 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Filter className="w-4 h-4" />
                访客筛选
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">国家</label>
                  <input
                    type="text"
                    placeholder="按国家筛选..."
                    value={vCountry}
                    onChange={e => { setVCountry(e.target.value); setVPage(1); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">最低线索评分: {vMinScore}</label>
                  <input
                    type="range" min={0} max={100} value={vMinScore}
                    onChange={e => { setVMinScore(Number(e.target.value)); setVPage(1); }}
                    className="w-full accent-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">最高线索评分: {vMaxScore}</label>
                  <input
                    type="range" min={0} max={100} value={vMaxScore}
                    onChange={e => { setVMaxScore(Number(e.target.value)); setVPage(1); }}
                    className="w-full accent-primary-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 访客详细列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">访客详细列表</h3>
              <p className="text-xs text-gray-400 mt-0.5">共 {visitorTotal} 条记录</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['IP', '国家', '城市', '浏览器', '页面数', '停留时间', '线索评分', '首次访问', '最近访问'].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">暂无访客数据</td></tr>
                  ) : visitors.map(v => {
                    const lead = getLeadLabel(v.leadScore);
                    return (
                      <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-xs font-mono text-gray-600">{maskIp(v.ip)}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700">{v.country ?? '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">{v.city ?? '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">{v.browser ?? '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700 font-medium">{v._count.pageViews}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-600">{formatDuration(v.visitCount)}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${lead.cls}`}>
                            {v.leadScore} — {lead.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(v.firstVisit)}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(v.lastVisit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {vTotalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">第 {vPage} / {vTotalPages} 页（共 {visitorTotal} 条）</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVPage(p => Math.max(1, p - 1))} disabled={vPage <= 1}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >上一页</button>
                  <button
                    onClick={() => setVPage(p => Math.min(vTotalPages, p + 1))} disabled={vPage >= vTotalPages}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >下一页</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════ INQUIRY TAB ═══════════ */}
      {tab === 'inquiries' && !loading && (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: '总询价数', value: inquiryTotal,  color: 'bg-blue-50 text-blue-600' },
              { label: '新询价',   value: inqNew,        color: 'bg-sky-50 text-sky-600' },
              { label: '处理中',   value: inqProcessing, color: 'bg-yellow-50 text-yellow-600' },
              { label: '已报价',   value: inqQuoted,     color: 'bg-green-50 text-green-600' },
              { label: '已关闭',   value: inqClosed,     color: 'bg-gray-50 text-gray-500' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className={`inline-flex p-2.5 rounded-lg ${s.color} mb-3`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 状态分布 + 客户国家分布 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="状态分布" icon={<FileText className="w-4 h-4 text-purple-500" />}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                    {statusPie.map((_, i) => <Cell key={i} fill={statusPieColors[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <PieLegend data={statusPie} colors={statusPieColors} />
            </ChartCard>

            <ChartCard title="客户国家分布" icon={<Globe className="w-4 h-4 text-green-500" />}>
              {inqCountryPie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={inqCountryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={renderPieLabel}>
                        {inqCountryPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <PieLegend data={inqCountryPie} />
                </>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无国家数据</p>}
            </ChartCard>
          </div>

          {/* 热门产品 + 国家条形图 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="询价热门产品" icon={<BarChart3 className="w-4 h-4 text-emerald-500" />}>
              {topProductsBar.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topProductsBar} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="询价次数" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无产品数据</p>}
            </ChartCard>

            <ChartCard title="询价国家分布" icon={<MapPin className="w-4 h-4 text-amber-500" />}>
              {inqCountryBar.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inqCountryBar}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="询价数" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 py-12 text-center">暂无国家数据</p>}
            </ChartCard>
          </div>

          {/* 30天询价趋势 */}
          <ChartCard title="30天询价趋势" icon={<TrendingUp className="w-4 h-4 text-purple-500" />}>
            {inquiriesOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={inquiriesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="inquiries" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="询价数" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 py-12 text-center">暂无趋势数据</p>}
          </ChartCard>

          {/* 联系方式汇总 */}
          {inquiries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  联系方式汇总
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">公司</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">联系人</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">邮箱</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">电话</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">国家</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map(inq => (
                      <tr key={inq.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-sm text-gray-800 font-medium">{inq.companyName}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-700">{inq.contactName}</td>
                        <td className="px-4 py-2.5 text-sm text-blue-600">{inq.email}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{inq.phone ?? '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{inq.country ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 状态筛选 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Filter className="w-4 h-4" />
                状态筛选
              </div>
              {[
                { key: 'all', label: '全部' },
                { key: 'new', label: '新询价' },
                { key: 'processing', label: '处理中' },
                { key: 'quoted', label: '已报价' },
                { key: 'closed', label: '已关闭' },
              ].map(s => (
                <button
                  key={s.key}
                  onClick={() => { setIStatus(s.key); setIPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    iStatus === s.key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 询价详细列表 */}
          {inquiries.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">暂无询价数据</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">询价详细列表</h3>
                <p className="text-xs text-gray-400 mt-0.5">共 {inquiryTotal} 条记录 · 点击行展开详情</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-3 w-8" />
                      {['编号', '公司', '联系人', '邮箱', '电话', '国家', '产品数', '状态', '创建时间'].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map(inq => {
                      const isExpanded = expandedInquiries.has(inq.id);
                      const statusInfo = STATUS_MAP[inq.status] ?? { label: inq.status, cls: 'bg-gray-100 text-gray-600 ring-gray-500/20' };
                      return (
                        <Fragment key={inq.id}>
                          <tr
                            onClick={() => toggleExpand(inq.id)}
                            className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-3 py-2.5 text-center">
                              {isExpanded
                                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                : <ChevronDown className="w-4 h-4 text-gray-400" />}
                            </td>
                            <td className="px-3 py-2.5 text-xs font-mono text-gray-600">{inq.inquiryNumber}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-800 font-medium">{inq.companyName}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-700">{inq.contactName}</td>
                            <td className="px-3 py-2.5 text-sm text-blue-600">{inq.email}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-600">{inq.phone ?? '—'}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-600">{inq.country ?? '—'}</td>
                            <td className="px-3 py-2.5 text-sm text-gray-700 font-medium">{inq.items.length}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${statusInfo.cls}`}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(inq.createdAt)}</td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={10} className="bg-slate-50 p-0">
                                <div className="px-8 py-5 space-y-4">
                                  {inq.message && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <p className="text-xs font-semibold text-gray-500 mb-1">留言内容</p>
                                      <p className="text-sm text-gray-700">{inq.message}</p>
                                    </div>
                                  )}
                                  {inq.techRequirements && (
                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                      <p className="text-xs font-semibold text-gray-500 mb-1">技术要求</p>
                                      <p className="text-sm text-gray-700">{inq.techRequirements}</p>
                                    </div>
                                  )}

                                  {inq.items.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 mb-2">询价产品明细</p>
                                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="bg-gray-100">
                                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">产品名称</th>
                                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">数量</th>
                                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">单位</th>
                                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">规格要求</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {inq.items.map(item => (
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
                                    </div>
                                  )}

                                  {(inq.followUps?.length ?? 0) > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 mb-2">跟进记录</p>
                                      <div className="space-y-3">
                                        {inq.followUps!.map(fu => {
                                          const actionInfo = ACTION_MAP[fu.action] ?? { label: fu.action, icon: '📋' };
                                          return (
                                            <div key={fu.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-200">
                                              <span className="text-lg flex-shrink-0 mt-0.5">{actionInfo.icon}</span>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="font-medium text-gray-700 text-sm">{actionInfo.label}</span>
                                                  <span className="text-xs text-gray-400">{fmtDate(fu.createdAt)}</span>
                                                  <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{fu.createdBy}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{fu.content}</p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {(inq.followUps?.length ?? 0) === 0 && (
                                    <p className="text-xs text-gray-400 italic">暂无跟进记录</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {iTotalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-500">第 {iPage} / {iTotalPages} 页（共 {inquiryTotal} 条）</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIPage(p => Math.max(1, p - 1))} disabled={iPage <= 1}
                      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >上一页</button>
                    <button
                      onClick={() => setIPage(p => Math.min(iTotalPages, p + 1))} disabled={iPage >= iTotalPages}
                      className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >下一页</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
"""

content += rest

with open(FILE_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

lines = content.count('\n') + 1
print(f"Written {lines} lines to {FILE_PATH}")
