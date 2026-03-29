'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  FileText,
  Image as ImageIcon,
  Link2,
  FolderDown,
  Plus,
  Trash2,
  Save,
  Loader2,
  Upload,
  X,
  ExternalLink,
  Download,
  Search,
  RefreshCw,
  Eye,
  ToggleLeft,
  ToggleRight,
  Globe,
  Pencil,
  Check,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Setting {
  id: string;
  key: string;
  value: string;
}

interface PageContentItem {
  page: string;
  section: string;
  field: string;
  lang: string;
  value: string;
  key: string; // full key for API
}

interface ImageItem {
  key: string;
  name: string;
  url: string;
}

interface LinkItem {
  key: string;
  label: string;
  url: string;
  icon: string;
  active: boolean;
}

interface FileItem {
  key: string;
  displayName: string;
  url: string;
  category: string;
  originalName: string;
}

type TabId = 'content' | 'images' | 'links' | 'files';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TABS: { id: TabId; labelEn: string; labelZh: string; icon: typeof FileText }[] = [
  { id: 'content', labelEn: 'Page Content', labelZh: '页面内容', icon: FileText },
  { id: 'images', labelEn: 'Images & Media', labelZh: '图片与媒体', icon: ImageIcon },
  { id: 'links', labelEn: 'Links & Navigation', labelZh: '链接与导航', icon: Link2 },
  { id: 'files', labelEn: 'Files & Documents', labelZh: '文件与文档', icon: FolderDown },
];

const PAGE_OPTIONS = ['home', 'about', 'contact', 'products', 'services'];
const SECTION_OPTIONS = ['hero', 'intro', 'features', 'cta', 'footer', 'meta'];
const FIELD_OPTIONS = ['title', 'subtitle', 'description', 'buttonText', 'caption'];
const LANG_OPTIONS = ['en', 'zh'];

const DEFAULT_CONTENT: Omit<PageContentItem, 'key'>[] = [
  { page: 'home', section: 'hero', field: 'title', lang: 'en', value: '' },
  { page: 'home', section: 'hero', field: 'title', lang: 'zh', value: '' },
  { page: 'home', section: 'hero', field: 'subtitle', lang: 'en', value: '' },
  { page: 'home', section: 'hero', field: 'subtitle', lang: 'zh', value: '' },
  { page: 'home', section: 'cta', field: 'title', lang: 'en', value: '' },
  { page: 'home', section: 'cta', field: 'title', lang: 'zh', value: '' },
  { page: 'about', section: 'intro', field: 'description', lang: 'en', value: '' },
  { page: 'about', section: 'intro', field: 'description', lang: 'zh', value: '' },
  { page: 'contact', section: 'hero', field: 'title', lang: 'en', value: '' },
  { page: 'contact', section: 'hero', field: 'title', lang: 'zh', value: '' },
  { page: 'contact', section: 'intro', field: 'description', lang: 'en', value: '' },
  { page: 'contact', section: 'intro', field: 'description', lang: 'zh', value: '' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildContentKey(page: string, section: string, field: string, lang: string) {
  return `page.${page}.${section}.${field}.${lang}`;
}

function parseContentKey(key: string): { page: string; section: string; field: string; lang: string } | null {
  const parts = key.replace(/^page\./, '').split('.');
  if (parts.length < 4) return null;
  return { page: parts[0], section: parts[1], field: parts[2], lang: parts[3] };
}

function parseImageKey(key: string): string {
  return key.replace(/^image\./, '');
}

function parseLinkValue(value: string): { label: string; url: string; icon: string; active: boolean } {
  try {
    return JSON.parse(value);
  } catch {
    return { label: '', url: value, icon: '', active: true };
  }
}

function parseFileValue(value: string): { displayName: string; url: string; category: string; originalName: string } {
  try {
    return JSON.parse(value);
  } catch {
    return { displayName: '', url: value, category: '', originalName: '' };
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function CMSPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const zh = locale === 'zh';

  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [allSettings, setAllSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Content tab state ---
  const [contentItems, setContentItems] = useState<PageContentItem[]>([]);
  const [contentFilter, setContentFilter] = useState('');
  const [showAddContent, setShowAddContent] = useState(false);
  const [newContent, setNewContent] = useState({ page: 'home', section: 'hero', field: 'title', lang: 'en', value: '' });
  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // --- Images tab state ---
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newImageName, setNewImageName] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- Links tab state ---
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);
  const [showAddLink, setShowAddLink] = useState(false);
  const [newLink, setNewLink] = useState({ label: '', url: '', icon: '', active: true });
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [editingLinkData, setEditingLinkData] = useState({ label: '', url: '', icon: '', active: true });

  // --- Files tab state ---
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newFileDisplayName, setNewFileDisplayName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('catalog');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------- */
  /*  Data Fetching                                                   */
  /* ---------------------------------------------------------------- */

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      const settings: Setting[] = data.settings ?? [];
      setAllSettings(settings);
      hydrateFromSettings(settings);
    } catch {
      toast.error(zh ? '加载失败' : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [zh]);

  const hydrateFromSettings = (settings: Setting[]) => {
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    // Content items
    const content: PageContentItem[] = [];
    const seenKeys = new Set<string>();

    // From settings
    settings.forEach((s) => {
      if (s.key.startsWith('page.')) {
        const parsed = parseContentKey(s.key);
        if (parsed) {
          content.push({ ...parsed, value: s.value, key: s.key });
          seenKeys.add(s.key);
        }
      }
    });

    // Add defaults not yet in settings
    DEFAULT_CONTENT.forEach((d) => {
      const key = buildContentKey(d.page, d.section, d.field, d.lang);
      if (!seenKeys.has(key)) {
        content.push({ ...d, key, value: '' });
      }
    });

    content.sort((a, b) => a.key.localeCompare(b.key));
    setContentItems(content);

    // Image items
    const images: ImageItem[] = [];
    settings.forEach((s) => {
      if (s.key.startsWith('image.')) {
        images.push({ key: s.key, name: parseImageKey(s.key), url: s.value });
      }
    });
    setImageItems(images);

    // Link items
    const links: LinkItem[] = [];
    settings.forEach((s) => {
      if (s.key.startsWith('link.')) {
        const parsed = parseLinkValue(s.value);
        links.push({ key: s.key, ...parsed });
      }
    });
    setLinkItems(links);

    // File items
    const files: FileItem[] = [];
    settings.forEach((s) => {
      if (s.key.startsWith('file.')) {
        const parsed = parseFileValue(s.value);
        files.push({ key: s.key, ...parsed });
      }
    });
    setFileItems(files);
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /* ---------------------------------------------------------------- */
  /*  Save helpers                                                    */
  /* ---------------------------------------------------------------- */

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: [{ key, value }] }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(zh ? '已保存' : 'Saved');
      await fetchSettings();
    } catch {
      toast.error(zh ? '保存失败' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    setSaving(true);
    try {
      // Save all settings except the one to delete
      const remaining = allSettings.filter((s) => s.key !== key);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: remaining.map((s) => ({ key: s.key, value: s.value })) }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(zh ? '已删除' : 'Deleted');
      await fetchSettings();
    } catch {
      toast.error(zh ? '删除失败' : 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Content handlers                                                */
  /* ---------------------------------------------------------------- */

  const handleSaveContent = async (item: PageContentItem) => {
    await saveSetting(item.key, item.value);
    setEditingContent(null);
  };

  const handleAddContent = async () => {
    const key = buildContentKey(newContent.page, newContent.section, newContent.field, newContent.lang);
    if (contentItems.some((c) => c.key === key)) {
      toast.error(zh ? '该条目已存在' : 'This entry already exists');
      return;
    }
    await saveSetting(key, newContent.value);
    setShowAddContent(false);
    setNewContent({ page: 'home', section: 'hero', field: 'title', lang: 'en', value: '' });
  };

  const handleDeleteContent = async (key: string) => {
    if (!confirm(zh ? '确定删除？' : 'Delete this entry?')) return;
    await deleteSetting(key);
  };

  const startEditContent = (item: PageContentItem) => {
    setEditingContent(item.key);
    setEditingValue(item.value);
  };

  const cancelEditContent = () => {
    setEditingContent(null);
    setEditingValue('');
  };

  const confirmEditContent = async (item: PageContentItem) => {
    await saveSetting(item.key, editingValue);
    setEditingContent(null);
    setEditingValue('');
  };

  /* ---------------------------------------------------------------- */
  /*  Image handlers                                                  */
  /* ---------------------------------------------------------------- */

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newImageName.trim()) {
      toast.error(zh ? '请输入图片名称' : 'Please enter an image name');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }
      const { url } = await uploadRes.json();
      const key = `image.${newImageName.trim().replace(/\s+/g, '-').toLowerCase()}`;
      await saveSetting(key, url);
      setNewImageName('');
      if (imageInputRef.current) imageInputRef.current.value = '';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (key: string) => {
    if (!confirm(zh ? '确定删除此图片？' : 'Delete this image?')) return;
    await deleteSetting(key);
  };

  /* ---------------------------------------------------------------- */
  /*  Link handlers                                                   */
  /* ---------------------------------------------------------------- */

  const handleAddLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) {
      toast.error(zh ? '请填写标签和链接' : 'Please fill in label and URL');
      return;
    }
    const slug = newLink.label.trim().replace(/\s+/g, '-').toLowerCase();
    const key = `link.${slug}`;
    const value = JSON.stringify({ label: newLink.label, url: newLink.url, icon: newLink.icon, active: newLink.active });
    await saveSetting(key, value);
    setShowAddLink(false);
    setNewLink({ label: '', url: '', icon: '', active: true });
  };

  const handleToggleLink = async (item: LinkItem) => {
    const value = JSON.stringify({ label: item.label, url: item.url, icon: item.icon, active: !item.active });
    await saveSetting(item.key, value);
  };

  const handleDeleteLink = async (key: string) => {
    if (!confirm(zh ? '确定删除此链接？' : 'Delete this link?')) return;
    await deleteSetting(key);
  };

  const startEditLink = (item: LinkItem) => {
    setEditingLink(item.key);
    setEditingLinkData({ label: item.label, url: item.url, icon: item.icon, active: item.active });
  };

  const confirmEditLink = async (key: string) => {
    const value = JSON.stringify(editingLinkData);
    await saveSetting(key, value);
    setEditingLink(null);
  };

  /* ---------------------------------------------------------------- */
  /*  File handlers                                                   */
  /* ---------------------------------------------------------------- */

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newFileDisplayName.trim()) {
      toast.error(zh ? '请输入显示名称' : 'Please enter a display name');
      return;
    }
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }
      const { url, originalName } = await uploadRes.json();
      const slug = newFileDisplayName.trim().replace(/\s+/g, '-').toLowerCase();
      const key = `file.${newFileCategory}.${slug}`;
      const value = JSON.stringify({ displayName: newFileDisplayName, url, category: newFileCategory, originalName });
      await saveSetting(key, value);
      setNewFileDisplayName('');
      setNewFileCategory('catalog');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      toast.error(message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!confirm(zh ? '确定删除此文件？' : 'Delete this file?')) return;
    await deleteSetting(key);
  };

  /* ---------------------------------------------------------------- */
  /*  Filtered content                                                */
  /* ---------------------------------------------------------------- */

  const filteredContent = contentFilter
    ? contentItems.filter(
        (c) =>
          c.page.includes(contentFilter.toLowerCase()) ||
          c.section.includes(contentFilter.toLowerCase()) ||
          c.field.includes(contentFilter.toLowerCase()) ||
          c.value.toLowerCase().includes(contentFilter.toLowerCase())
      )
    : contentItems;

  /* ---------------------------------------------------------------- */
  /*  Render: Loading state                                           */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {zh ? '内容管理' : 'Content Management'}
        </h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Tab Content                                             */
  /* ---------------------------------------------------------------- */

  const renderContentTab = () => (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={zh ? '搜索页面、区域、字段...' : 'Search page, section, field...'}
            value={contentFilter}
            onChange={(e) => setContentFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          onClick={() => setShowAddContent(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {zh ? '添加内容' : 'Add Content'}
        </button>
      </div>

      {/* Add content modal */}
      {showAddContent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">{zh ? '添加页面内容' : 'Add Page Content'}</h3>
              <button onClick={() => setShowAddContent(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '页面' : 'Page'}</label>
                  <select
                    value={newContent.page}
                    onChange={(e) => setNewContent({ ...newContent, page: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {PAGE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '区域' : 'Section'}</label>
                  <select
                    value={newContent.section}
                    onChange={(e) => setNewContent({ ...newContent, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {SECTION_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '字段' : 'Field'}</label>
                  <select
                    value={newContent.field}
                    onChange={(e) => setNewContent({ ...newContent, field: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {FIELD_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '语言' : 'Language'}</label>
                  <select
                    value={newContent.lang}
                    onChange={(e) => setNewContent({ ...newContent, lang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {LANG_OPTIONS.map((l) => (
                      <option key={l} value={l}>{l === 'en' ? 'English' : '中文'}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '内容' : 'Content'}</label>
                <textarea
                  rows={3}
                  value={newContent.value}
                  onChange={(e) => setNewContent({ ...newContent, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder={zh ? '输入内容...' : 'Enter content...'}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddContent(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {zh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleAddContent}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {zh ? '添加' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredContent.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{zh ? '暂无内容' : 'No content found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '页面' : 'Page'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '区域' : 'Section'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '字段' : 'Field'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '语言' : 'Lang'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '内容' : 'Value'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{zh ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContent.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{item.page}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.section}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.field}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.lang === 'en' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                        {item.lang === 'en' ? 'EN' : '中文'}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {editingContent === item.key ? (
                        <textarea
                          rows={2}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm focus:ring-2 focus:ring-primary-500"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-gray-700 truncate" title={item.value}>
                          {item.value || <span className="text-gray-300 italic">{zh ? '(空)' : '(empty)'}</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingContent === item.key ? (
                          <>
                            <button
                              onClick={() => confirmEditContent(item)}
                              disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title={zh ? '保存' : 'Save'}
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={cancelEditContent}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                              title={zh ? '取消' : 'Cancel'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditContent(item)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                              title={zh ? '编辑' : 'Edit'}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteContent(item.key)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title={zh ? '删除' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderImagesTab = () => (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {zh ? '上传图片' : 'Upload Image'}
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '图片名称/标识' : 'Image Name / Key'}</label>
            <input
              type="text"
              value={newImageName}
              onChange={(e) => setNewImageName(e.target.value)}
              placeholder={zh ? '例: hero-banner' : 'e.g. hero-banner'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '选择文件' : 'Choose File'}</label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageUpload}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary-600 flex-shrink-0" />}
        </div>
      </div>

      {/* Image grid */}
      {imageItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{zh ? '暂无图片' : 'No images uploaded'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imageItems.map((img) => (
            <div key={img.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="aspect-video bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <a href={img.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg shadow-sm mr-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(img.key)}
                    className="p-2 bg-white rounded-lg shadow-sm"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800 truncate">{img.name}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{img.url}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLinksTab = () => (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddLink(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {zh ? '添加链接' : 'Add Link'}
        </button>
      </div>

      {/* Add link modal */}
      {showAddLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">{zh ? '添加链接' : 'Add Link'}</h3>
              <button onClick={() => setShowAddLink(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '标签' : 'Label'}</label>
                <input
                  type="text"
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder={zh ? '例: LinkedIn' : 'e.g. LinkedIn'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '图标名称' : 'Icon Name'}</label>
                <input
                  type="text"
                  value={newLink.icon}
                  onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                  placeholder={zh ? '例: linkedin, facebook, globe' : 'e.g. linkedin, facebook, globe'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddLink(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                {zh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleAddLink}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {zh ? '添加' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {linkItems.length === 0 ? (
          <div className="p-12 text-center">
            <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{zh ? '暂无链接' : 'No links configured'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '标签' : 'Label'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '图标' : 'Icon'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '状态' : 'Status'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{zh ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {linkItems.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingLink === item.key ? (
                        <input
                          type="text"
                          value={editingLinkData.label}
                          onChange={(e) => setEditingLinkData({ ...editingLinkData, label: e.target.value })}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {editingLink === item.key ? (
                        <input
                          type="url"
                          value={editingLinkData.url}
                          onChange={(e) => setEditingLinkData({ ...editingLinkData, url: e.target.value })}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm"
                        />
                      ) : (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline truncate block"
                        >
                          {item.url}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingLink === item.key ? (
                        <input
                          type="text"
                          value={editingLinkData.icon}
                          onChange={(e) => setEditingLinkData({ ...editingLinkData, icon: e.target.value })}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">{item.icon || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleLink(item)}
                        disabled={saving}
                        className="flex items-center gap-1.5"
                        title={item.active ? (zh ? '已启用' : 'Active') : (zh ? '已禁用' : 'Inactive')}
                      >
                        {item.active ? (
                          <ToggleRight className="w-6 h-6 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-300" />
                        )}
                        <span className={`text-xs font-medium ${item.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.active ? (zh ? '启用' : 'Active') : (zh ? '禁用' : 'Inactive')}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingLink === item.key ? (
                          <>
                            <button
                              onClick={() => confirmEditLink(item.key)}
                              disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingLink(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditLink(item)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLink(item.key)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {zh ? '上传文件' : 'Upload File'}
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '显示名称' : 'Display Name'}</label>
            <input
              type="text"
              value={newFileDisplayName}
              onChange={(e) => setNewFileDisplayName(e.target.value)}
              placeholder={zh ? '例: 2024产品目录' : 'e.g. 2024 Product Catalog'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '分类' : 'Category'}</label>
            <select
              value={newFileCategory}
              onChange={(e) => setNewFileCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="catalog">{zh ? '目录' : 'Catalog'}</option>
              <option value="certification">{zh ? '认证' : 'Certification'}</option>
              <option value="brochure">{zh ? '宣传册' : 'Brochure'}</option>
              <option value="manual">{zh ? '手册' : 'Manual'}</option>
              <option value="other">{zh ? '其他' : 'Other'}</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">{zh ? '选择文件' : 'Choose File'}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
              onChange={handleFileUpload}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          {uploadingFile && <Loader2 className="w-5 h-5 animate-spin text-primary-600 flex-shrink-0" />}
        </div>
      </div>

      {/* Files table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {fileItems.length === 0 ? (
          <div className="p-12 text-center">
            <FolderDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{zh ? '暂无文件' : 'No files uploaded'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '名称' : 'Name'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '分类' : 'Category'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{zh ? '文件名' : 'Filename'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{zh ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fileItems.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">{item.displayName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                      {item.originalName || item.url}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={item.url}
                          download
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title={zh ? '下载' : 'Download'}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          title={zh ? '查看' : 'View'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteFile(item.key)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title={zh ? '删除' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Main render                                                     */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {zh ? '内容管理' : 'Content Management'}
        </h1>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          title={zh ? '刷新' : 'Refresh'}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-blue-50 text-blue-600 mb-2">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{contentItems.length}</p>
          <p className="text-xs text-gray-500">{zh ? '页面内容' : 'Page Content'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-green-50 text-green-600 mb-2">
            <ImageIcon className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{imageItems.length}</p>
          <p className="text-xs text-gray-500">{zh ? '图片' : 'Images'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-orange-50 text-orange-600 mb-2">
            <Link2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{linkItems.length}</p>
          <p className="text-xs text-gray-500">{zh ? '链接' : 'Links'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="inline-flex p-2 rounded-lg bg-purple-50 text-purple-600 mb-2">
            <FolderDown className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{fileItems.length}</p>
          <p className="text-xs text-gray-500">{zh ? '文件' : 'Files'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-4 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {zh ? tab.labelZh : tab.labelEn}
              </button>
            );
          })}
        </div>
        <div className="p-4 lg:p-6">
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'images' && renderImagesTab()}
          {activeTab === 'links' && renderLinksTab()}
          {activeTab === 'files' && renderFilesTab()}
        </div>
      </div>
    </div>
  );
}
