'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  Plus,
  X,
  Loader2,
  Trash2,
  Search,
  Mail,
  Phone,
  Building2,
  Globe,
  Tag,
  RefreshCw,
  AlertTriangle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Calendar,
  Clock,
  FileText,
  PhoneCall,
  Video,
  StickyNote,
  ShoppingCart,
  TrendingUp,
  Filter,
  Star,
  Activity,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InquirySummary {
  id: string;
  inquiryNumber?: string;
  status: string;
  createdAt: string;
}

interface FollowUpSummary {
  id: string;
  action: string;
  createdAt: string;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  country: string | null;
  tags: string;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  inquiries: InquirySummary[];
  followUps: FollowUpSummary[];
}

interface InquiryDetail {
  id: string;
  inquiryNumber?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  message?: string;
  status: string;
  createdAt: string;
  items?: { id: string; productName?: string; quantity?: number }[];
}

interface FollowUpDetail {
  id: string;
  action: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface CustomerDetail extends Omit<Customer, 'inquiries' | 'followUps'> {
  inquiries: InquiryDetail[];
  followUps: FollowUpDetail[];
}

interface Stats {
  total: number;
  bySource: Record<string, number>;
  active: number;
  newThisMonth: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PREDEFINED_TAGS = [
  '重要客户', 'VIP', '新客户', '询价客户',
  '潜在客户', '待跟进', '已合作', '流失客户',
];

const TAG_COLORS: Record<string, string> = {
  '重要客户': 'bg-red-100 text-red-700 border-red-200',
  'VIP': 'bg-amber-100 text-amber-700 border-amber-200',
  '新客户': 'bg-green-100 text-green-700 border-green-200',
  '询价客户': 'bg-blue-100 text-blue-700 border-blue-200',
  '潜在客户': 'bg-purple-100 text-purple-700 border-purple-200',
  '待跟进': 'bg-orange-100 text-orange-700 border-orange-200',
  '已合作': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '流失客户': 'bg-gray-100 text-gray-600 border-gray-200',
};

const SOURCE_LABELS: Record<string, string> = {
  inquiry: '询价',
  manual: '手动添加',
  newsletter: '订阅',
};

const SOURCE_COLORS: Record<string, string> = {
  inquiry: 'bg-blue-100 text-blue-700',
  manual: 'bg-emerald-100 text-emerald-700',
  newsletter: 'bg-purple-100 text-purple-700',
};

const ACTION_CONFIG: Record<string, { label: string; icon: typeof Phone; color: string }> = {
  call: { label: '电话', icon: PhoneCall, color: 'bg-green-100 text-green-600 border-green-300' },
  email: { label: '邮件', icon: Mail, color: 'bg-blue-100 text-blue-600 border-blue-300' },
  meeting: { label: '会议', icon: Video, color: 'bg-purple-100 text-purple-600 border-purple-300' },
  note: { label: '备注', icon: StickyNote, color: 'bg-amber-100 text-amber-600 border-amber-300' },
  order: { label: '订单', icon: ShoppingCart, color: 'bg-red-100 text-red-600 border-red-300' },
};

const EMPTY_ADD_FORM = { name: '', email: '', company: '', phone: '', country: '', tags: [] as string[], notes: '' };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseTags(tagsStr: string): string[] {
  try { return JSON.parse(tagsStr); } catch { return []; }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || 'bg-sky-100 text-sky-700 border-sky-200';
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function CustomersPage() {
  // List state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, bySource: {}, active: 0, newThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add form
  const [addForm, setAddForm] = useState({ ...EMPTY_ADD_FORM });
  const [submitting, setSubmitting] = useState(false);

  // Follow-up form
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ action: 'call', content: '' });
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);

  // Tag editing in detail
  const [editingTags, setEditingTags] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  Data fetching                                                    */
  /* ---------------------------------------------------------------- */

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', '20');
      if (search) qs.set('search', search);
      if (filterSource) qs.set('source', filterSource);
      if (filterTag) qs.set('tag', filterTag);

      const res = await fetch(`/api/admin/customers?${qs}`);
      if (!res.ok) throw new Error('加载失败');
      const data = await res.json();
      setCustomers(data.customers ?? []);
      setTotalPages(data.totalPages ?? 1);
      if (data.stats) setStats(data.stats);
    } catch {
      toast.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterSource, filterTag]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCustomerDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) throw new Error('加载失败');
      const data: CustomerDetail = await res.json();
      setSelectedCustomer(data);
      setEditingTags(false);
      setShowFollowUpForm(false);
    } catch {
      toast.error('加载客户详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Actions                                                          */
  /* ---------------------------------------------------------------- */

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '添加失败');
      }
      toast.success('客户添加成功');
      setShowAddModal(false);
      setAddForm({ ...EMPTY_ADD_FORM });
      fetchCustomers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除失败');
      toast.success('客户已删除');
      setShowDeleteConfirm(null);
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
      fetchCustomers();
    } catch {
      toast.error('删除客户失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTags = async (customerId: string, tags: string[]) => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error('更新失败');
      const updated: CustomerDetail = await res.json();
      setSelectedCustomer(updated);
      toast.success('标签已更新');
      fetchCustomers();
    } catch {
      toast.error('标签更新失败');
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !followUpForm.content.trim()) return;
    setFollowUpSubmitting(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '添加失败');
      }
      toast.success('跟进记录已添加');
      setFollowUpForm({ action: 'call', content: '' });
      setShowFollowUpForm(false);
      fetchCustomerDetail(selectedCustomer.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '添加失败');
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Derived                                                          */
  /* ---------------------------------------------------------------- */

  const statCards = useMemo(() => [
    { label: '客户总数', value: stats.total, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: '活跃客户', value: stats.active, icon: Activity, color: 'bg-green-50 text-green-600', sub: '近30天有询价' },
    { label: '本月新增', value: stats.newThisMonth, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
    { label: '询价来源', value: stats.bySource.inquiry ?? 0, icon: FileText, color: 'bg-amber-50 text-amber-600' },
  ], [stats]);

  const detailTags = useMemo(() => selectedCustomer ? parseTags(selectedCustomer.tags) : [], [selectedCustomer]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理客户信息、跟进记录和询价历史</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCustomers} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50" title="刷新">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            新增客户
          </button>
        </div>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className={`inline-flex p-2 rounded-lg ${s.color} mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
              {'sub' in s && s.sub && <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* ==================== SEARCH & FILTERS ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、邮箱、公司..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {/* Source filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
            >
              <option value="">全部来源</option>
              <option value="inquiry">询价</option>
              <option value="manual">手动添加</option>
              <option value="newsletter">订阅</option>
            </select>
          </div>
          {/* Tag filter */}
          <div className="relative">
            <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filterTag}
              onChange={(e) => { setFilterTag(e.target.value); setPage(1); }}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
            >
              <option value="">全部标签</option>
              {PREDEFINED_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ==================== CUSTOMER TABLE ==================== */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无客户数据</p>
          <button onClick={() => setShowAddModal(true)} className="mt-4 text-primary-600 text-sm font-medium hover:underline">
            + 新增客户
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">姓名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">公司</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">联系方式</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">国家</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">标签</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">来源</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">最近活动</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">询价</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => {
                  const tags = parseTags(cust.tags);
                  const lastActivity = cust.followUps?.[0]?.createdAt || cust.inquiries?.[0]?.createdAt || cust.updatedAt;
                  return (
                    <tr
                      key={cust.id}
                      className="border-b border-gray-100 hover:bg-primary-50/40 cursor-pointer transition-colors"
                      onClick={() => fetchCustomerDetail(cust.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{cust.name}</p>
                            <p className="text-xs text-gray-500 truncate">{cust.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cust.company || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 space-y-0.5">
                          {cust.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{cust.phone}</div>}
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{cust.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {cust.country ? (
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-gray-400" />{cust.country}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {tags.slice(0, 3).map((t) => (
                            <span key={t} className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${getTagColor(t)}`}>{t}</span>
                          ))}
                          {tags.length > 3 && <span className="text-[10px] text-gray-400">+{tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[cust.source] || 'bg-gray-100 text-gray-600'}`}>
                          {SOURCE_LABELS[cust.source] || cust.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {relativeTime(lastActivity)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <FileText className="w-3 h-3" />
                          {cust.inquiries?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(cust.id); }}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
              <p className="text-xs text-gray-500">第 {page} / {totalPages} 页</p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="p-1.5 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== CUSTOMER DETAIL MODAL ==================== */}
      {(selectedCustomer || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 my-auto">
            {detailLoading && !selectedCustomer ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : selectedCustomer && (
              <>
                {/* Detail Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{selectedCustomer.name}</h2>
                      <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setEditingTags(false); setShowFollowUpForm(false); }} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Detail Body */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                  {/* Customer Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoItem icon={Building2} label="公司" value={selectedCustomer.company} />
                    <InfoItem icon={Phone} label="电话" value={selectedCustomer.phone} />
                    <InfoItem icon={Globe} label="国家" value={selectedCustomer.country} />
                    <InfoItem icon={Calendar} label="创建时间" value={formatDate(selectedCustomer.createdAt)} />
                    <InfoItem icon={Clock} label="最近更新" value={relativeTime(selectedCustomer.updatedAt)} />
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 rounded bg-gray-100"><Star className="w-3.5 h-3.5 text-gray-500" /></div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">来源</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${SOURCE_COLORS[selectedCustomer.source] || 'bg-gray-100 text-gray-600'}`}>
                          {SOURCE_LABELS[selectedCustomer.source] || selectedCustomer.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedCustomer.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">📝 备注</p>
                      <p className="text-sm text-amber-900">{selectedCustomer.notes}</p>
                    </div>
                  )}

                  {/* Tags Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <Tag className="w-4 h-4" /> 标签
                      </h3>
                      <button
                        onClick={() => setEditingTags(!editingTags)}
                        className="text-xs text-primary-600 hover:underline"
                      >
                        {editingTags ? '完成' : '编辑标签'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {detailTags.map((t) => (
                        <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getTagColor(t)}`}>
                          {t}
                          {editingTags && (
                            <button
                              onClick={() => handleUpdateTags(selectedCustomer.id, detailTags.filter((x) => x !== t))}
                              className="ml-0.5 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      {detailTags.length === 0 && !editingTags && (
                        <span className="text-xs text-gray-400">暂无标签</span>
                      )}
                    </div>
                    {editingTags && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">点击添加标签：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {PREDEFINED_TAGS.filter((t) => !detailTags.includes(t)).map((t) => (
                            <button
                              key={t}
                              onClick={() => handleUpdateTags(selectedCustomer.id, [...detailTags, t])}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border hover:shadow-sm transition-shadow ${getTagColor(t)} opacity-60 hover:opacity-100`}
                            >
                              <Plus className="w-3 h-3" /> {t}
                            </button>
                          ))}
                          {PREDEFINED_TAGS.filter((t) => !detailTags.includes(t)).length === 0 && (
                            <span className="text-xs text-gray-400">所有预定义标签已添加</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inquiries Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                      <FileText className="w-4 h-4" /> 询价记录 ({selectedCustomer.inquiries.length})
                    </h3>
                    {selectedCustomer.inquiries.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">暂无询价记录</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedCustomer.inquiries.map((inq) => (
                          <div key={inq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-500">
                                  {inq.inquiryNumber || inq.id.slice(0, 8)}
                                </span>
                                <InquiryStatusBadge status={inq.status} />
                              </div>
                              {inq.message && <p className="text-xs text-gray-600 mt-1 truncate">{inq.message}</p>}
                              {inq.items && inq.items.length > 0 && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {inq.items.length} 个产品
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                              {formatDate(inq.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Follow-ups Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" /> 跟进记录 ({selectedCustomer.followUps.length})
                      </h3>
                      <button
                        onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                        className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                      >
                        <Plus className="w-3 h-3" /> 添加跟进
                      </button>
                    </div>

                    {/* Add Follow-up Form */}
                    {showFollowUpForm && (
                      <form onSubmit={handleAddFollowUp} className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">操作类型</label>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                const isActive = followUpForm.action === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setFollowUpForm({ ...followUpForm, action: key })}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                      isActive ? `${cfg.color} border-current shadow-sm` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">内容</label>
                            <textarea
                              rows={3}
                              required
                              value={followUpForm.content}
                              onChange={(e) => setFollowUpForm({ ...followUpForm, content: e.target.value })}
                              placeholder="记录跟进内容..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowFollowUpForm(false)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
                              取消
                            </button>
                            <button type="submit" disabled={followUpSubmitting} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                              {followUpSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                              保存
                            </button>
                          </div>
                        </div>
                      </form>
                    )}

                    {/* Follow-up Timeline */}
                    {selectedCustomer.followUps.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">暂无跟进记录</p>
                    ) : (
                      <div className="relative pl-6 space-y-0 max-h-64 overflow-y-auto">
                        {/* Timeline line */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200" />
                        {selectedCustomer.followUps.map((fu, idx) => {
                          const cfg = ACTION_CONFIG[fu.action] || ACTION_CONFIG.note;
                          const Icon = cfg.icon;
                          return (
                            <div key={fu.id} className="relative pb-4">
                              {/* Timeline dot */}
                              <div className={`absolute -left-6 top-1 w-[18px] h-[18px] rounded-full border-2 border-white flex items-center justify-center ${cfg.color}`}>
                                <Icon className="w-2.5 h-2.5" />
                              </div>
                              <div className={`ml-2 p-3 rounded-lg border ${idx === 0 ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}>
                                    <Icon className="w-3 h-3" /> {cfg.label}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{formatDateTime(fu.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{fu.content}</p>
                                <p className="text-[10px] text-gray-400 mt-1">由 {fu.createdBy} 记录</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== ADD CUSTOMER MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> 新增客户
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                  <input type="text" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="客户姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                  <input type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                  <input type="text" value={addForm.company} onChange={(e) => setAddForm({ ...addForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="公司名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input type="text" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="+86 ..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">国家</label>
                <input type="text" value={addForm.country} onChange={(e) => setAddForm({ ...addForm, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="国家/地区" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_TAGS.map((t) => {
                    const isSelected = addForm.tags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAddForm({
                          ...addForm,
                          tags: isSelected ? addForm.tags.filter((x) => x !== t) : [...addForm.tags, t],
                        })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected ? getTagColor(t) : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea rows={3} value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="备注信息..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  新增客户
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRM MODAL ==================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可撤销，将同时删除所有跟进记录。</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50">
                取消
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)} disabled={submitting} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function InfoItem({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-2">
      <div className="p-1.5 rounded bg-gray-100"><Icon className="w-3.5 h-3.5 text-gray-500" /></div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

const INQUIRY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: '新询价', color: 'bg-blue-100 text-blue-700' },
  processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-700' },
  quoted: { label: '已报价', color: 'bg-purple-100 text-purple-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-600' },
};

function InquiryStatusBadge({ status }: { status: string }) {
  const cfg = INQUIRY_STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}
