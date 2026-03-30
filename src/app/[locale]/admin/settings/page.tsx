'use client';

import { useEffect, useState, useRef } from 'react';
import { Settings, Save, Loader2, Plus, Trash2, Upload, Image as ImageIcon, Mail, Building2, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';

interface Setting {
  id: string;
  key: string;
  value: string;
}

const BASIC_KEYS = ['company_name', 'company_tagline', 'company_email', 'company_phone', 'company_address'];
const BASIC_LABELS: Record<string, string> = {
  company_name: '公司名称',
  company_tagline: '公司标语',
  company_email: '公司邮箱',
  company_phone: '联系电话',
  company_address: '公司地址',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data.settings ?? []))
      .catch(() => toast.error('加载设置失败'))
      .finally(() => setLoading(false));

    fetch('/api/exchange-rates')
      .then((res) => res.json())
      .then((data) => {
        if (data.rates) setExchangeRates(data.rates);
      })
      .catch(() => {});
  }, []);

  const getSettingValue = (key: string) => settings.find((s) => s.key === key)?.value ?? '';

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => {
      const exists = prev.find((s) => s.key === key);
      if (exists) {
        return prev.map((s) => (s.key === key ? { ...s, value } : s));
      }
      return [...prev, { id: '', key, value }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: settings.map((s) => ({ key: s.key, value: s.value })),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setSettings(data.settings);
      toast.success('设置已保存');
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();

      updateSetting('company_logo', uploadData.url);

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [{ key: 'company_logo', value: uploadData.url }],
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Logo 已上传');
    } catch {
      toast.error('上传失败');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    updateSetting('company_logo', '');
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [{ key: 'company_logo', value: '' }],
        }),
      });
      toast.success('Logo 已移除');
    } catch {
      toast.error('操作失败');
    }
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    if (settings.some((s) => s.key === newKey.trim())) {
      toast.error('键名已存在');
      return;
    }
    setSettings((prev) => [...prev, { id: '', key: newKey.trim(), value: newValue }]);
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (key: string) => {
    setSettings((prev) => prev.filter((s) => s.key !== key));
  };

  const logoUrl = getSettingValue('company_logo');
  const advancedSettings = settings.filter(
    (s) => !BASIC_KEYS.includes(s.key) && s.key !== 'company_logo' && s.key !== 'inquiry_email'
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存所有设置
        </button>
      </div>

      {/* Logo Upload */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">公司Logo</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-48 h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
              {logoUrl ? (
                <Image src={getImageUrl(logoUrl)} alt="Company Logo" width={200} height={60} className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                  <span className="text-xs">暂无Logo</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-gray-600">
                上传公司Logo，建议使用透明背景的 PNG 或 SVG 格式，推荐尺寸 200×60 像素。
              </p>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {logoUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  上传Logo
                </button>
                {logoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    移除Logo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">基本设置</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {BASIC_KEYS.map((key) => (
            <div key={key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="sm:w-1/3">
                <label className="text-sm font-medium text-gray-700">{BASIC_LABELS[key]}</label>
                <p className="text-xs text-gray-400 mt-0.5">{key}</p>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={getSettingValue(key)}
                  onChange={(e) => updateSetting(key, e.target.value)}
                  placeholder={`请输入${BASIC_LABELS[key]}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inquiry Email Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">询价邮箱设置</h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="sm:w-1/3">
              <label className="text-sm font-medium text-gray-700">询价通知邮箱</label>
              <p className="text-xs text-gray-400 mt-0.5">inquiry_email</p>
            </div>
            <div className="flex-1">
              <input
                type="email"
                value={getSettingValue('inquiry_email')}
                onChange={(e) => updateSetting('inquiry_email', e.target.value)}
                placeholder="收到询价时通知此邮箱"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">客户提交询价单后，系统将发送通知到此邮箱。</p>
        </div>
      </div>

      {/* Exchange Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">汇率设置</h3>
        </div>
        <div className="p-6">
          {exchangeRates ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(exchangeRates).map(([currency, rate]) => (
                <div key={currency} className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-xs text-gray-400 mb-1">1 CNY =</div>
                  <div className="text-lg font-semibold text-gray-800">{Number(rate).toFixed(4)}</div>
                  <div className="text-sm text-gray-500">{currency}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无汇率数据，汇率将在系统启动时自动获取。</p>
          )}
          <p className="mt-4 text-xs text-gray-400">汇率数据为系统自动获取，仅供参考。基准货币为人民币（CNY）。</p>
        </div>
      </div>

      {/* Advanced Settings (Key-Value Editor) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">高级设置</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {advancedSettings.map((setting) => (
            <div key={setting.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="sm:w-1/3">
                <label className="text-sm font-medium text-gray-700">{setting.key}</label>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => updateSetting(setting.key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => handleRemove(setting.key)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {advancedSettings.length === 0 && (
            <div className="px-6 py-8 text-center">
              <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">暂无其他自定义设置</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Setting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          添加新设置
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">键名</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="setting_key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">值</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="setting_value"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
