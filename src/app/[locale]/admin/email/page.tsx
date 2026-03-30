'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Plus,
  Send,
  Calendar,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  BarChart3,
  FileText,
  Megaphone,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  MousePointerClick,
  MailOpen,
  Power,
  PowerOff,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  templateId: string | null;
  subject: string;
  body: string;
  type: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  targetTags: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CampaignStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
}

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const TEMPLATE_TYPES = [
  { value: 'welcome', label: 'Welcome', labelZh: '欢迎邮件', color: 'bg-green-100 text-green-700' },
  { value: 'inquiry_followup', label: 'Follow-up', labelZh: '询价跟进', color: 'bg-blue-100 text-blue-700' },
  { value: 'promotion', label: 'Promotion', labelZh: '促销推广', color: 'bg-orange-100 text-orange-700' },
  { value: 'holiday', label: 'Holiday', labelZh: '节日问候', color: 'bg-purple-100 text-purple-700' },
  { value: 'custom', label: 'Custom', labelZh: '自定义', color: 'bg-gray-100 text-gray-700' },
];

const CAMPAIGN_STATUSES: Record<string, { label: string; labelZh: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Draft', labelZh: '草稿', color: 'bg-gray-100 text-gray-600', icon: FileText },
  scheduled: { label: 'Scheduled', labelZh: '已计划', color: 'bg-blue-100 text-blue-700', icon: Clock },
  sending: { label: 'Sending', labelZh: '发送中', color: 'bg-yellow-100 text-yellow-700', icon: Loader2 },
  sent: { label: 'Sent', labelZh: '已发送', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', labelZh: '已取消', color: 'bg-red-100 text-red-600', icon: XCircle },
};

const PLACEHOLDER_VARS = [
  { name: '{{customerName}}', desc: '客户名称' },
  { name: '{{companyName}}', desc: '公司名称' },
  { name: '{{inquiryNumber}}', desc: '询价编号' },
  { name: '{{productList}}', desc: '产品列表 HTML' },
];

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

export default function EmailMarketingPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'campaigns'>('campaigns');
  const [stats, setStats] = useState<CampaignStats>({ totalSent: 0, totalOpened: 0, totalClicked: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<EmailCampaign[]>([]);

  // ---- Templates state ----
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', bodyHtml: '', type: 'custom' });
  const [templateSaving, setTemplateSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // ---- Campaigns state ----
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignTotalPages, setCampaignTotalPages] = useState(1);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('all');
  const [campaignModal, setCampaignModal] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    templateId: '',
    subject: '',
    bodyHtml: '',
    type: 'manual',
    targetTags: '' as string,
    scheduledAt: '',
  });
  const [campaignSaving, setCampaignSaving] = useState(false);

  // ---- Campaign detail modal ----
  const [detailCampaign, setDetailCampaign] = useState<EmailCampaign | null>(null);
  const [detailLogs, setDetailLogs] = useState<{ to: string; status: string; sentAt: string }[]>([]);
  const [detailStatusCounts, setDetailStatusCounts] = useState<Record<string, number>>({});

  // ---- Action loading ----
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Fetch Functions                                                   */
  /* ---------------------------------------------------------------- */

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch('/api/admin/email/templates');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast.error('获取模板失败');
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(campaignPage), limit: '20' });
      if (campaignStatusFilter !== 'all') qs.set('status', campaignStatusFilter);
      const res = await fetch(`/api/admin/email/campaigns?${qs}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setCampaignTotalPages(data.totalPages || 1);
      setStats(data.stats || { totalSent: 0, totalOpened: 0, totalClicked: 0 });
      if (campaignPage === 1 && campaignStatusFilter === 'all') {
        setRecentCampaigns((data.campaigns || []).slice(0, 5));
      }
    } catch {
      toast.error('获取活动列表失败');
    } finally {
      setCampaignsLoading(false);
    }
  }, [campaignPage, campaignStatusFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  /* ---------------------------------------------------------------- */
  /*  Template Actions                                                  */
  /* ---------------------------------------------------------------- */

  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({ name: '', subject: '', bodyHtml: '', type: 'custom' });
    setPreviewHtml('');
    setTemplateModal(true);
  };

  const openEditTemplate = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({ name: t.name, subject: t.subject, bodyHtml: t.body, type: t.type });
    setPreviewHtml(t.body);
    setTemplateModal(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.bodyHtml) {
      toast.error('请填写所有必填字段');
      return;
    }
    setTemplateSaving(true);
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const payload = editingTemplate
        ? { id: editingTemplate.id, ...templateForm }
        : templateForm;
      const res = await fetch('/api/admin/email/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '操作失败');
      }
      toast.success(editingTemplate ? '模板已更新' : '模板已创建');
      setTemplateModal(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setTemplateSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('确定要删除此模板吗？')) return;
    try {
      const res = await fetch(`/api/admin/email/templates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('模板已删除');
      fetchTemplates();
    } catch {
      toast.error('删除失败');
    }
  };

  const toggleTemplateActive = async (t: EmailTemplate) => {
    try {
      const res = await fetch('/api/admin/email/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, active: !t.active }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.active ? '模板已停用' : '模板已启用');
      fetchTemplates();
    } catch {
      toast.error('操作失败');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Campaign Actions                                                  */
  /* ---------------------------------------------------------------- */

  const openNewCampaign = () => {
    setCampaignForm({
      name: '',
      templateId: '',
      subject: '',
      bodyHtml: '',
      type: 'manual',
      targetTags: '',
      scheduledAt: '',
    });
    setCampaignModal(true);
  };

  const applyTemplate = (templateId: string) => {
    const t = templates.find((tpl) => tpl.id === templateId);
    if (t) {
      setCampaignForm((prev) => ({
        ...prev,
        templateId: t.id,
        subject: t.subject,
        bodyHtml: t.body,
      }));
    }
  };

  const saveCampaign = async () => {
    if (!campaignForm.name || !campaignForm.subject || !campaignForm.bodyHtml) {
      toast.error('请填写所有必填字段');
      return;
    }
    setCampaignSaving(true);
    try {
      const targetTags = campaignForm.targetTags
        ? campaignForm.targetTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const res = await fetch('/api/admin/email/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignForm.name,
          templateId: campaignForm.templateId || null,
          subject: campaignForm.subject,
          bodyHtml: campaignForm.bodyHtml,
          type: campaignForm.type,
          targetTags,
          scheduledAt: campaignForm.scheduledAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '创建失败');
      }
      toast.success('活动已创建');
      setCampaignModal(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCampaignSaving(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('确定要删除此活动吗？')) return;
    try {
      const res = await fetch(`/api/admin/email/campaigns?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('活动已删除');
      fetchCampaigns();
    } catch {
      toast.error('删除失败');
    }
  };

  const campaignAction = async (id: string, action: string, scheduledAt?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, scheduledAt }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '操作失败');
      }
      const actionLabels: Record<string, string> = {
        send: '活动发送已开始',
        schedule: '活动已计划',
        cancel: '活动已取消',
      };
      toast.success(actionLabels[action] || '操作成功');
      fetchCampaigns();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setActionLoading(null);
    }
  };

  const viewCampaignDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/email/campaigns/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetailCampaign(data.campaign);
      setDetailLogs(data.logs || []);
      setDetailStatusCounts(data.statusCounts || {});
    } catch {
      toast.error('获取活动详情失败');
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Helpers                                                           */
  /* ---------------------------------------------------------------- */

  const typeInfo = (type: string) =>
    TEMPLATE_TYPES.find((t) => t.value === type) || TEMPLATE_TYPES[4];

  const statusInfo = (status: string) =>
    CAMPAIGN_STATUSES[status] || CAMPAIGN_STATUSES.draft;

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleString('zh-CN') : '-';

  const openRate = stats.totalSent > 0 ? ((stats.totalOpened / stats.totalSent) * 100).toFixed(1) : '0';
  const clickRate = stats.totalSent > 0 ? ((stats.totalClicked / stats.totalSent) * 100).toFixed(1) : '0';

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">邮件营销</h1>
          <p className="text-sm text-gray-500 mt-1">管理邮件模板和营销活动</p>
        </div>
      </div>

      {/* ---- Dashboard Stats ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Send} label="总发送量" value={stats.totalSent.toLocaleString()} color="blue" />
        <StatCard icon={MailOpen} label="打开率" value={`${openRate}%`} sub={`${stats.totalOpened} 已打开`} color="green" />
        <StatCard icon={MousePointerClick} label="点击率" value={`${clickRate}%`} sub={`${stats.totalClicked} 已点击`} color="orange" />
        <StatCard icon={Megaphone} label="最近活动" value={String(recentCampaigns.length)} sub="近期活动数" color="purple" />
      </div>

      {/* ---- Tabs ---- */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'campaigns'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Megaphone className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          营销活动
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          邮件模板
        </button>
      </div>

      {/* ================================================================ */}
      {/*  TEMPLATES TAB                                                    */}
      {/* ================================================================ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openNewTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> 新建模板
            </button>
          </div>

          {templatesLoading ? (
            <LoadingSkeleton rows={4} />
          ) : templates.length === 0 ? (
            <EmptyState icon={FileText} text="暂无邮件模板" />
          ) : (
            <div className="grid gap-4">
              {templates.map((t) => {
                const ti = typeInfo(t.type);
                return (
                  <div key={t.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ti.color}`}>
                          {ti.labelZh}
                        </span>
                        {!t.active && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                            已停用
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">主题: {t.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">更新于 {fmtDate(t.updatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setPreviewHtml(t.body); setEditingTemplate(t); }}
                        className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="预览"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditTemplate(t)}
                        className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleTemplateActive(t)}
                        className={`p-2 rounded-lg transition-colors ${
                          t.active
                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={t.active ? '停用' : '启用'}
                      >
                        {t.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/*  CAMPAIGNS TAB                                                    */}
      {/* ================================================================ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {['all', 'draft', 'scheduled', 'sending', 'sent', 'cancelled'].map((s) => (
                <button
                  key={s}
                  onClick={() => { setCampaignStatusFilter(s); setCampaignPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    campaignStatusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {s === 'all' ? '全部' : (CAMPAIGN_STATUSES[s]?.labelZh || s)}
                </button>
              ))}
            </div>
            <button
              onClick={openNewCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> 新建活动
            </button>
          </div>

          {campaignsLoading ? (
            <LoadingSkeleton rows={4} />
          ) : campaigns.length === 0 ? (
            <EmptyState icon={Megaphone} text="暂无营销活动" />
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-5 py-3">活动名称</th>
                        <th className="px-5 py-3">类型</th>
                        <th className="px-5 py-3">状态</th>
                        <th className="px-5 py-3 text-center">已发送</th>
                        <th className="px-5 py-3 text-center">打开</th>
                        <th className="px-5 py-3 text-center">点击</th>
                        <th className="px-5 py-3">创建时间</th>
                        <th className="px-5 py-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {campaigns.map((c) => {
                        const si = statusInfo(c.status);
                        const StatusIcon = si.icon;
                        return (
                          <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="font-medium text-gray-900 text-sm truncate max-w-[200px]">{c.name}</p>
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.subject}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs text-gray-500">{c.type}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${si.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {si.labelZh}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center text-sm font-medium text-gray-700">{c.totalSent}</td>
                            <td className="px-5 py-3.5 text-center text-sm text-gray-500">{c.totalOpened}</td>
                            <td className="px-5 py-3.5 text-center text-sm text-gray-500">{c.totalClicked}</td>
                            <td className="px-5 py-3.5 text-xs text-gray-400">{fmtDate(c.createdAt)}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => viewCampaignDetail(c.id)}
                                  className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                  title="详情"
                                >
                                  <BarChart3 className="w-4 h-4" />
                                </button>
                                {(c.status === 'draft' || c.status === 'scheduled') && (
                                  <button
                                    onClick={() => campaignAction(c.id, 'send')}
                                    disabled={actionLoading === c.id}
                                    className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 disabled:opacity-50"
                                    title="立即发送"
                                  >
                                    {actionLoading === c.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                {c.status === 'draft' && (
                                  <button
                                    onClick={() => {
                                      const dt = prompt('计划发送时间 (YYYY-MM-DD HH:mm):');
                                      if (dt) campaignAction(c.id, 'schedule', new Date(dt).toISOString());
                                    }}
                                    className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                    title="计划发送"
                                  >
                                    <Calendar className="w-4 h-4" />
                                  </button>
                                )}
                                {c.status === 'scheduled' && (
                                  <button
                                    onClick={() => campaignAction(c.id, 'cancel')}
                                    className="p-1.5 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                    title="取消计划"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {c.status === 'draft' && (
                                  <button
                                    onClick={() => deleteCampaign(c.id)}
                                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    title="删除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {campaignTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                    disabled={campaignPage <= 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {campaignPage} / {campaignTotalPages}
                  </span>
                  <button
                    onClick={() => setCampaignPage((p) => Math.min(campaignTotalPages, p + 1))}
                    disabled={campaignPage >= campaignTotalPages}
                    className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/*  TEMPLATE MODAL                                                   */}
      {/* ================================================================ */}
      {templateModal && (
        <Modal title={editingTemplate ? '编辑模板' : '新建模板'} onClose={() => setTemplateModal(false)} wide>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板名称 *</label>
                <input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例如: Welcome Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TEMPLATE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.labelZh}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮件主题 *</label>
                <input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email subject line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮件内容 (HTML) *</label>
                <textarea
                  value={templateForm.bodyHtml}
                  onChange={(e) => {
                    setTemplateForm({ ...templateForm, bodyHtml: e.target.value });
                    setPreviewHtml(e.target.value);
                  }}
                  rows={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="<html>...</html>"
                />
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600 mb-2">可用变量:</p>
                <div className="flex flex-wrap gap-2">
                  {PLACEHOLDER_VARS.map((v) => (
                    <span
                      key={v.name}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 cursor-pointer hover:bg-blue-50"
                      onClick={() =>
                        setTemplateForm((f) => ({ ...f, bodyHtml: f.bodyHtml + v.name }))
                      }
                      title={`点击插入 ${v.name}`}
                    >
                      <code>{v.name}</code> - {v.desc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预览</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white h-[500px]">
                <iframe
                  srcDoc={previewHtml || '<p style="padding:20px;color:#999;font-size:14px;">在左侧输入 HTML 内容后预览将显示在此处</p>'}
                  className="w-full h-full border-0"
                  sandbox=""
                  title="Email Preview"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setTemplateModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={saveTemplate}
              disabled={templateSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {templateSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingTemplate ? '保存修改' : '创建模板'}
            </button>
          </div>
        </Modal>
      )}

      {/* ================================================================ */}
      {/*  CAMPAIGN MODAL                                                   */}
      {/* ================================================================ */}
      {campaignModal && (
        <Modal title="新建营销活动" onClose={() => setCampaignModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">活动名称 *</label>
              <input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例如: 2024 Spring Promotion"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">使用模板（可选）</label>
              <select
                value={campaignForm.templateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- 不使用模板 --</option>
                {templates.filter((t) => t.active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({typeInfo(t.type).labelZh})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件主题 *</label>
              <input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮件内容 (HTML) *</label>
              <textarea
                value={campaignForm.bodyHtml}
                onChange={(e) => setCampaignForm({ ...campaignForm, bodyHtml: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标受众</label>
              <input
                value={campaignForm.targetTags}
                onChange={(e) => setCampaignForm({ ...campaignForm, targetTags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="留空 = 所有客户，__newsletter__ = 订阅用户，或标签逗号分隔"
              />
              <p className="text-xs text-gray-400 mt-1">输入客户标签，用逗号分隔。输入 <code>__newsletter__</code> 发送给订阅用户。留空发送给所有客户。</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计划发送时间（可选）</label>
              <input
                type="datetime-local"
                value={campaignForm.scheduledAt}
                onChange={(e) => setCampaignForm({ ...campaignForm, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCampaignModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={saveCampaign}
              disabled={campaignSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {campaignSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              创建活动
            </button>
          </div>
        </Modal>
      )}

      {/* ================================================================ */}
      {/*  CAMPAIGN DETAIL MODAL                                            */}
      {/* ================================================================ */}
      {detailCampaign && (
        <Modal title="活动详情" onClose={() => setDetailCampaign(null)} wide>
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{detailCampaign.totalSent}</p>
                <p className="text-xs text-blue-600 mt-1">已发送</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{detailCampaign.totalOpened}</p>
                <p className="text-xs text-green-600 mt-1">已打开</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">{detailCampaign.totalClicked}</p>
                <p className="text-xs text-orange-600 mt-1">已点击</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{detailStatusCounts['failed'] || 0}</p>
                <p className="text-xs text-red-600 mt-1">失败</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">活动名称:</span> <span className="font-medium text-gray-900">{detailCampaign.name}</span></div>
              <div><span className="text-gray-500">状态:</span> <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo(detailCampaign.status).color}`}>{statusInfo(detailCampaign.status).labelZh}</span></div>
              <div><span className="text-gray-500">主题:</span> <span className="text-gray-700">{detailCampaign.subject}</span></div>
              <div><span className="text-gray-500">创建者:</span> <span className="text-gray-700">{detailCampaign.createdBy}</span></div>
              <div><span className="text-gray-500">创建时间:</span> <span className="text-gray-700">{fmtDate(detailCampaign.createdAt)}</span></div>
              <div><span className="text-gray-500">发送时间:</span> <span className="text-gray-700">{fmtDate(detailCampaign.sentAt)}</span></div>
            </div>

            {detailLogs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">发送记录 (最近 200 条)</h4>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-left text-xs text-gray-500">
                        <th className="px-4 py-2">收件人</th>
                        <th className="px-4 py-2">状态</th>
                        <th className="px-4 py-2">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailLogs.map((log, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700">{log.to}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.status === 'sent' ? 'bg-green-100 text-green-700' :
                              log.status === 'failed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-400 text-xs">{fmtDate(log.sentAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Reusable Components                                                */
/* ================================================================== */

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Send;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const bg = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    purple: 'bg-purple-50',
  }[color] || 'bg-gray-50';
  const iconColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  }[color] || 'text-gray-600';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
      <div className={`${bg} p-3 rounded-lg`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-5xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
