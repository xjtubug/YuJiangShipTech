'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Setting {
  id: string;
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data.settings ?? []))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

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
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newKey.trim()) return;
    if (settings.some((s) => s.key === newKey.trim())) {
      toast.error('Key already exists');
      return;
    }
    setSettings((prev) => [...prev, { id: '', key: newKey.trim(), value: newValue }]);
    setNewKey('');
    setNewValue('');
  };

  const handleRemove = (key: string) => {
    setSettings((prev) => prev.filter((s) => s.key !== key));
  };

  const handleUpdate = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Site Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-800">Site Configuration</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {settings.map((setting) => (
            <div key={setting.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="sm:w-1/3">
                <label className="text-sm font-medium text-gray-700">{setting.key}</label>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={setting.value}
                  onChange={(e) => handleUpdate(setting.key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={() => handleRemove(setting.key)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {settings.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Settings className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No settings configured</p>
            </div>
          )}
        </div>
      </div>

      {/* Add New Setting */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Setting
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Key</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="setting_key"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Value</label>
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
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
