'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/image-utils';
import {
  FileText,
  Image as ImageIcon,
  Link2,
  FolderDown,
  Plus,
  Trash2,
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
  Pencil,
  Check,
  Newspaper,
  Briefcase,
  Award,
  Video,
  Sparkles,
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
  key: string;
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

interface NewsItem {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  contentEn: string;
  contentZh: string;
  excerpt: string | null;
  image: string | null;
  source: string | null;
  published: boolean;
  createdAt: string;
}

interface CaseStudyItem {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  clientName: string;
  clientLogo: string | null;
  country: string;
  image: string | null;
  contentEn: string;
  contentZh: string;
  rating: number;
  createdAt: string;
}

interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  image: string | null;
  pdfUrl: string | null;
  validUntil: string | null;
  createdAt: string;
}

type TabId = 'content' | 'images' | 'links' | 'files' | 'news' | 'cases' | 'certificates';

/* ------------------------------------------------------------------ */
/*  Reusable: ImageUploadField                                        */
/* ------------------------------------------------------------------ */

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(data.url);
      toast.success('上传成功');
    } catch {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {value ? (
        <div className="relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(value)} alt="" className="w-full h-40 object-cover rounded-lg border border-gray-200" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100">更换</button>
            <button type="button" onClick={() => onChange('')} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">删除</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">点击上传图片</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG, SVG, WebP</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="或输入图片URL"
        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable: FileUploadField                                         */
/* ------------------------------------------------------------------ */

function FileUploadField({
  label,
  value,
  onChange,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.zip',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onChange(data.url);
      toast.success('上传成功');
    } catch {
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline truncate flex-1">
            {value.split('/').pop() || value}
          </a>
          <button type="button" onClick={() => inputRef.current?.click()} className="px-2 py-1 bg-white text-gray-600 rounded text-xs border border-gray-300 hover:bg-gray-50">更换</button>
          <button type="button" onClick={() => onChange('')} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs border border-red-200 hover:bg-red-100">删除</button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-gray-400 mx-auto animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="text-sm text-gray-500">点击上传文件</p>
              <p className="text-xs text-gray-400 mt-1">支持 PDF, DOC, XLS, ZIP</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="或输入文件URL"
        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const TABS: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'news', label: '新闻资讯', icon: Newspaper },
  { id: 'cases', label: '客户案例', icon: Briefcase },
  { id: 'certificates', label: '资质证书', icon: Award },
  { id: 'content', label: '页面内容', icon: FileText },
  { id: 'images', label: '图片与媒体', icon: ImageIcon },
  { id: 'links', label: '链接与导航', icon: Link2 },
  { id: 'files', label: '文件与文档', icon: FolderDown },
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

const EMPTY_NEWS = { titleEn: '', titleZh: '', contentEn: '', contentZh: '', excerpt: '', image: '', source: '', published: true, videoUrl: '' };
const EMPTY_CASE = { titleEn: '', titleZh: '', clientName: '', clientLogo: '', country: '', image: '', contentEn: '', contentZh: '', rating: 5, videoUrl: '' };
const EMPTY_CERT = { name: '', issuer: '', image: '', pdfUrl: '', validUntil: '' };

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function CMSPage() {
  const params = useParams();
  void params; // locale available if needed

  const [activeTab, setActiveTab] = useState<TabId>('news');
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

  // --- News tab state ---
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsForm, setNewsForm] = useState(EMPTY_NEWS);

  // --- Case Studies tab state ---
  const [caseItems, setCaseItems] = useState<CaseStudyItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseStudyItem | null>(null);
  const [caseForm, setCaseForm] = useState(EMPTY_CASE);

  // --- Certificates tab state ---
  const [certItems, setCertItems] = useState<CertificateItem[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null);
  const [certForm, setCertForm] = useState(EMPTY_CERT);

  // --- Translation state ---
  const [translatingNews, setTranslatingNews] = useState(false);
  const [translatingCase, setTranslatingCase] = useState(false);

  // Auto-translate helper: zh → en for news form
  const handleTranslateNews = async () => {
    const hasTitle = !!newsForm.titleZh.trim();
    const hasContent = !!newsForm.contentZh.trim();
    if (!hasTitle && !hasContent) {
      toast.error('请先填写中文标题或中文内容');
      return;
    }
    setTranslatingNews(true);
    try {
      const texts: Record<string, string> = {};
      if (hasTitle) texts.titleZh = newsForm.titleZh;
      if (hasContent) texts.contentZh = newsForm.contentZh;
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, from: 'zh', to: 'en' }),
      });
      if (!res.ok) throw new Error('翻译请求失败');
      const data = await res.json();
      const t = data.translated as Record<string, string>;
      setNewsForm((prev) => ({
        ...prev,
        ...(t.titleZh ? { titleEn: t.titleZh } : {}),
        ...(t.contentZh ? { contentEn: t.contentZh } : {}),
      }));
      toast.success('自动翻译完成，请检查并修正');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '翻译失败');
    } finally {
      setTranslatingNews(false);
    }
  };

  // Auto-translate helper: zh → en for case form
  const handleTranslateCase = async () => {
    const hasTitle = !!caseForm.titleZh.trim();
    const hasContent = !!caseForm.contentZh.trim();
    if (!hasTitle && !hasContent) {
      toast.error('请先填写中文标题或中文内容');
      return;
    }
    setTranslatingCase(true);
    try {
      const texts: Record<string, string> = {};
      if (hasTitle) texts.titleZh = caseForm.titleZh;
      if (hasContent) texts.contentZh = caseForm.contentZh;
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, from: 'zh', to: 'en' }),
      });
      if (!res.ok) throw new Error('翻译请求失败');
      const data = await res.json();
      const t = data.translated as Record<string, string>;
      setCaseForm((prev) => ({
        ...prev,
        ...(t.titleZh ? { titleEn: t.titleZh } : {}),
        ...(t.contentZh ? { contentEn: t.contentZh } : {}),
      }));
      toast.success('自动翻译完成，请检查并修正');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '翻译失败');
    } finally {
      setTranslatingCase(false);
    }
  };

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
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/admin/news');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setNewsItems(data.items ?? []);
    } catch {
      toast.error('加载新闻失败');
    } finally {
      setNewsLoading(false);
    }
  }, []);

  const fetchCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const res = await fetch('/api/admin/case-studies');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCaseItems(data.items ?? []);
    } catch {
      toast.error('加载案例失败');
    } finally {
      setCasesLoading(false);
    }
  }, []);

  const fetchCerts = useCallback(async () => {
    setCertsLoading(true);
    try {
      const res = await fetch('/api/admin/certificates');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCertItems(data.items ?? []);
    } catch {
      toast.error('加载证书失败');
    } finally {
      setCertsLoading(false);
    }
  }, []);

  const hydrateFromSettings = (settings: Setting[]) => {
    const content: PageContentItem[] = [];
    const seenKeys = new Set<string>();

    settings.forEach((s) => {
      if (s.key.startsWith('page.')) {
        const parsed = parseContentKey(s.key);
        if (parsed) {
          content.push({ ...parsed, value: s.value, key: s.key });
          seenKeys.add(s.key);
        }
      }
    });

    DEFAULT_CONTENT.forEach((d) => {
      const key = buildContentKey(d.page, d.section, d.field, d.lang);
      if (!seenKeys.has(key)) {
        content.push({ ...d, key, value: '' });
      }
    });

    content.sort((a, b) => a.key.localeCompare(b.key));
    setContentItems(content);

    const images: ImageItem[] = [];
    settings.forEach((s) => {
      if (s.key.startsWith('image.')) {
        images.push({ key: s.key, name: parseImageKey(s.key), url: s.value });
      }
    });
    setImageItems(images);

    const links: LinkItem[] = [];
    settings.forEach((s) => {
      if (s.key.startsWith('link.')) {
        const parsed = parseLinkValue(s.value);
        links.push({ key: s.key, ...parsed });
      }
    });
    setLinkItems(links);

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
    fetchNews();
    fetchCases();
    fetchCerts();
  }, [fetchSettings, fetchNews, fetchCases, fetchCerts]);

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
      toast.success('已保存');
      await fetchSettings();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    setSaving(true);
    try {
      const remaining = allSettings.filter((s) => s.key !== key);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: remaining.map((s) => ({ key: s.key, value: s.value })) }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('已删除');
      await fetchSettings();
    } catch {
      toast.error('删除失败');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Content handlers                                                */
  /* ---------------------------------------------------------------- */

  const handleAddContent = async () => {
    const key = buildContentKey(newContent.page, newContent.section, newContent.field, newContent.lang);
    if (contentItems.some((c) => c.key === key)) {
      toast.error('该条目已存在');
      return;
    }
    await saveSetting(key, newContent.value);
    setShowAddContent(false);
    setNewContent({ page: 'home', section: 'hero', field: 'title', lang: 'en', value: '' });
  };

  const handleDeleteContent = async (key: string) => {
    if (!confirm('确定删除此条目？此操作不可撤销。')) return;
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
      toast.error('请输入图片名称');
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
      const message = err instanceof Error ? err.message : '上传失败';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (key: string) => {
    if (!confirm('确定删除此图片？此操作不可撤销。')) return;
    await deleteSetting(key);
  };

  /* ---------------------------------------------------------------- */
  /*  Link handlers                                                   */
  /* ---------------------------------------------------------------- */

  const handleAddLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) {
      toast.error('请填写标签和链接');
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
    if (!confirm('确定删除此链接？此操作不可撤销。')) return;
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
      toast.error('请输入显示名称');
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
      const message = err instanceof Error ? err.message : '上传失败';
      toast.error(message);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!confirm('确定删除此文件？此操作不可撤销。')) return;
    await deleteSetting(key);
  };

  /* ---------------------------------------------------------------- */
  /*  News handlers                                                   */
  /* ---------------------------------------------------------------- */

  const openNewsModal = (item?: NewsItem) => {
    if (item) {
      setEditingNews(item);
      setNewsForm({
        titleEn: item.titleEn,
        titleZh: item.titleZh,
        contentEn: item.contentEn,
        contentZh: item.contentZh,
        excerpt: item.excerpt || '',
        image: item.image || '',
        source: item.source || '',
        published: item.published,
        videoUrl: item.source || '',
      });
    } else {
      setEditingNews(null);
      setNewsForm(EMPTY_NEWS);
    }
    setShowNewsModal(true);
  };

  const handleSaveNews = async () => {
    if (!newsForm.titleEn && !newsForm.titleZh) {
      toast.error('请填写新闻标题');
      return;
    }
    setSaving(true);
    try {
      const method = editingNews ? 'PUT' : 'POST';
      const body = editingNews
        ? { id: editingNews.id, ...newsForm }
        : newsForm;
      const res = await fetch('/api/admin/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(editingNews ? '新闻已更新' : '新闻已创建');
      setShowNewsModal(false);
      await fetchNews();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm('确定删除此新闻？此操作不可撤销。')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('新闻已删除');
      await fetchNews();
    } catch {
      toast.error('删除失败');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Case Study handlers                                             */
  /* ---------------------------------------------------------------- */

  const openCaseModal = (item?: CaseStudyItem) => {
    if (item) {
      setEditingCase(item);
      setCaseForm({
        titleEn: item.titleEn,
        titleZh: item.titleZh,
        clientName: item.clientName,
        clientLogo: item.clientLogo || '',
        country: item.country,
        image: item.image || '',
        contentEn: item.contentEn,
        contentZh: item.contentZh,
        rating: item.rating,
        videoUrl: '',
      });
    } else {
      setEditingCase(null);
      setCaseForm(EMPTY_CASE);
    }
    setShowCaseModal(true);
  };

  const handleSaveCase = async () => {
    if (!caseForm.titleEn && !caseForm.titleZh) {
      toast.error('请填写案例标题');
      return;
    }
    if (!caseForm.clientName) {
      toast.error('请填写客户名称');
      return;
    }
    setSaving(true);
    try {
      const method = editingCase ? 'PUT' : 'POST';
      const body = editingCase
        ? { id: editingCase.id, ...caseForm }
        : caseForm;
      const res = await fetch('/api/admin/case-studies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(editingCase ? '案例已更新' : '案例已创建');
      setShowCaseModal(false);
      await fetchCases();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCase = async (id: string) => {
    if (!confirm('确定删除此案例？此操作不可撤销。')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/case-studies?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('案例已删除');
      await fetchCases();
    } catch {
      toast.error('删除失败');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Certificate handlers                                            */
  /* ---------------------------------------------------------------- */

  const openCertModal = (item?: CertificateItem) => {
    if (item) {
      setEditingCert(item);
      setCertForm({
        name: item.name,
        issuer: item.issuer,
        image: item.image || '',
        pdfUrl: item.pdfUrl || '',
        validUntil: item.validUntil ? item.validUntil.split('T')[0] : '',
      });
    } else {
      setEditingCert(null);
      setCertForm(EMPTY_CERT);
    }
    setShowCertModal(true);
  };

  const handleSaveCert = async () => {
    if (!certForm.name) {
      toast.error('请填写证书名称');
      return;
    }
    setSaving(true);
    try {
      const method = editingCert ? 'PUT' : 'POST';
      const body = editingCert
        ? { id: editingCert.id, ...certForm }
        : certForm;
      const res = await fetch('/api/admin/certificates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(editingCert ? '证书已更新' : '证书已创建');
      setShowCertModal(false);
      await fetchCerts();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm('确定删除此证书？此操作不可撤销。')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/certificates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('证书已删除');
      await fetchCerts();
    } catch {
      toast.error('删除失败');
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Modal Backdrop                                          */
  /* ---------------------------------------------------------------- */

  const ModalBackdrop = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      {children}
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render: News Tab                                                */
  /* ---------------------------------------------------------------- */

  const renderNewsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {newsItems.length} 条新闻</p>
        <div className="flex gap-2">
          <button onClick={fetchNews} disabled={newsLoading} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openNewsModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" />新增
          </button>
        </div>
      </div>

      {newsLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : newsItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无新闻</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">图片</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">标题</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {newsItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getImageUrl(item.image)} alt="" className="w-16 h-10 object-cover rounded border border-gray-200" />
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{item.titleZh || item.titleEn}</p>
                      {item.titleEn && item.titleZh && <p className="text-xs text-gray-400 truncate max-w-xs">{item.titleEn}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.published ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openNewsModal(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="编辑">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteNews(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* News Modal */}
      {showNewsModal && (
        <ModalBackdrop onClose={() => setShowNewsModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-800">{editingNews ? '编辑新闻' : '新增新闻'}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTranslateNews}
                  disabled={translatingNews}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
                  title="根据中文标题和内容，自动翻译为英文"
                >
                  {translatingNews ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {translatingNews ? '翻译中…' : '中文→英文'}
                </button>
                <button onClick={() => setShowNewsModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">中文标题 *</label>
                  <input type="text" value={newsForm.titleZh} onChange={(e) => setNewsForm({ ...newsForm, titleZh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="输入中文标题" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">英文标题</label>
                  <input type="text" value={newsForm.titleEn} onChange={(e) => setNewsForm({ ...newsForm, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="Enter English title" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                <input type="text" value={newsForm.excerpt} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="简短描述" />
              </div>
              <ImageUploadField label="新闻图片" value={newsForm.image} onChange={(url) => setNewsForm({ ...newsForm, image: url })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Video className="w-4 h-4 inline mr-1" />视频链接（可选）
                </label>
                <input type="url" value={newsForm.videoUrl} onChange={(e) => setNewsForm({ ...newsForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">中文内容</label>
                <textarea rows={4} value={newsForm.contentZh} onChange={(e) => setNewsForm({ ...newsForm, contentZh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="输入中文内容..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文内容</label>
                <textarea rows={4} value={newsForm.contentEn} onChange={(e) => setNewsForm({ ...newsForm, contentEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="Enter English content..." />
              </div>
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">发布状态</label>
                <button type="button" onClick={() => setNewsForm({ ...newsForm, published: !newsForm.published })} className="flex items-center gap-1.5">
                  {newsForm.published ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                  <span className={`text-sm ${newsForm.published ? 'text-green-600' : 'text-gray-400'}`}>{newsForm.published ? '已发布' : '草稿'}</span>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowNewsModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSaveNews} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}保存
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render: Cases Tab                                               */
  /* ---------------------------------------------------------------- */

  const renderCasesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {caseItems.length} 个案例</p>
        <div className="flex gap-2">
          <button onClick={fetchCases} disabled={casesLoading} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${casesLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openCaseModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" />新增
          </button>
        </div>
      </div>

      {casesLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : caseItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无客户案例</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {caseItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="aspect-video bg-gray-100 relative">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openCaseModal(item)} className="p-2 bg-white rounded-lg shadow-sm"><Pencil className="w-4 h-4 text-gray-600" /></button>
                  <button onClick={() => handleDeleteCase(item.id)} className="p-2 bg-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800 truncate">{item.titleZh || item.titleEn}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.clientName} · {item.country}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-xs ${s <= item.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Modal */}
      {showCaseModal && (
        <ModalBackdrop onClose={() => setShowCaseModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-800">{editingCase ? '编辑案例' : '新增案例'}</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTranslateCase}
                  disabled={translatingCase}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
                  title="根据中文标题和内容，自动翻译为英文"
                >
                  {translatingCase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {translatingCase ? '翻译中…' : '中文→英文'}
                </button>
                <button onClick={() => setShowCaseModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">中文标题 *</label>
                  <input type="text" value={caseForm.titleZh} onChange={(e) => setCaseForm({ ...caseForm, titleZh: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="输入中文标题" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">英文标题</label>
                  <input type="text" value={caseForm.titleEn} onChange={(e) => setCaseForm({ ...caseForm, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="Enter English title" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户名称 *</label>
                  <input type="text" value={caseForm.clientName} onChange={(e) => setCaseForm({ ...caseForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="客户公司名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">国家/地区</label>
                  <input type="text" value={caseForm.country} onChange={(e) => setCaseForm({ ...caseForm, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：中国" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
                  <select value={caseForm.rating} onChange={(e) => setCaseForm({ ...caseForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} 星</option>)}
                  </select>
                </div>
              </div>
              <ImageUploadField label="案例图片" value={caseForm.image} onChange={(url) => setCaseForm({ ...caseForm, image: url })} />
              <ImageUploadField label="客户Logo" value={caseForm.clientLogo} onChange={(url) => setCaseForm({ ...caseForm, clientLogo: url })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Video className="w-4 h-4 inline mr-1" />视频链接（可选）
                </label>
                <input type="url" value={caseForm.videoUrl} onChange={(e) => setCaseForm({ ...caseForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">中文内容</label>
                <textarea rows={4} value={caseForm.contentZh} onChange={(e) => setCaseForm({ ...caseForm, contentZh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="输入中文内容..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">英文内容</label>
                <textarea rows={4} value={caseForm.contentEn} onChange={(e) => setCaseForm({ ...caseForm, contentEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="Enter English content..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowCaseModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSaveCase} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}保存
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render: Certificates Tab                                        */
  /* ---------------------------------------------------------------- */

  const renderCertificatesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {certItems.length} 个证书</p>
        <div className="flex gap-2">
          <button onClick={fetchCerts} disabled={certsLoading} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50">
            <RefreshCw className={`w-4 h-4 ${certsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openCertModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" />新增
          </button>
        </div>
      </div>

      {certsLoading ? (
        <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : certItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无资质证书</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certItems.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Award className="w-8 h-8 text-gray-300" /></div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openCertModal(item)} className="p-2 bg-white rounded-lg shadow-sm"><Pencil className="w-4 h-4 text-gray-600" /></button>
                  {item.pdfUrl && (
                    <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg shadow-sm"><Download className="w-4 h-4 text-primary-600" /></a>
                  )}
                  <button onClick={() => handleDeleteCert(item.id)} className="p-2 bg-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">发证机构：{item.issuer}</p>
                {item.validUntil && (
                  <p className="text-xs text-gray-400 mt-0.5">有效期至：{new Date(item.validUntil).toLocaleDateString('zh-CN')}</p>
                )}
                {item.pdfUrl && (
                  <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline mt-1">
                    <FileText className="w-3 h-3" />查看PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {showCertModal && (
        <ModalBackdrop onClose={() => setShowCertModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-800">{editingCert ? '编辑证书' : '新增证书'}</h3>
              <button onClick={() => setShowCertModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">证书名称 *</label>
                <input type="text" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：ISO 9001质量管理体系认证" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发证机构</label>
                <input type="text" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="如：中国船级社" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">有效期至</label>
                <input type="date" value={certForm.validUntil} onChange={(e) => setCertForm({ ...certForm, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <ImageUploadField label="证书图片" value={certForm.image} onChange={(url) => setCertForm({ ...certForm, image: url })} />
              <FileUploadField label="证书PDF文件" value={certForm.pdfUrl} onChange={(url) => setCertForm({ ...certForm, pdfUrl: url })} accept=".pdf" />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button onClick={() => setShowCertModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleSaveCert} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}保存
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Render: Content Tab                                             */
  /* ---------------------------------------------------------------- */

  const renderContentTab = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索页面、区域、字段..."
            value={contentFilter}
            onChange={(e) => setContentFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <button
          onClick={() => setShowAddContent(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />添加内容
        </button>
      </div>

      {showAddContent && (
        <ModalBackdrop onClose={() => setShowAddContent(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">添加页面内容</h3>
              <button onClick={() => setShowAddContent(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">页面</label>
                  <select value={newContent.page} onChange={(e) => setNewContent({ ...newContent, page: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    {PAGE_OPTIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">区域</label>
                  <select value={newContent.section} onChange={(e) => setNewContent({ ...newContent, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    {SECTION_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">字段</label>
                  <select value={newContent.field} onChange={(e) => setNewContent({ ...newContent, field: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    {FIELD_OPTIONS.map((f) => (<option key={f} value={f}>{f}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">语言</label>
                  <select value={newContent.lang} onChange={(e) => setNewContent({ ...newContent, lang: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                    {LANG_OPTIONS.map((l) => (<option key={l} value={l}>{l === 'en' ? 'English' : '中文'}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">内容</label>
                <textarea rows={3} value={newContent.value} onChange={(e) => setNewContent({ ...newContent, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="输入内容..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowAddContent(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleAddContent} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}添加
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredContent.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无内容</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">页面</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">区域</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">字段</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">语言</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">内容</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
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
                        <textarea rows={2} value={editingValue} onChange={(e) => setEditingValue(e.target.value)}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm focus:ring-2 focus:ring-primary-500" autoFocus />
                      ) : (
                        <p className="text-sm text-gray-700 truncate" title={item.value}>
                          {item.value || <span className="text-gray-300 italic">(空)</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingContent === item.key ? (
                          <>
                            <button onClick={() => confirmEditContent(item)} disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="保存">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={cancelEditContent} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="取消">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditContent(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="编辑">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteContent(item.key)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除">
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

  /* ---------------------------------------------------------------- */
  /*  Render: Images Tab                                              */
  /* ---------------------------------------------------------------- */

  const renderImagesTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" />上传图片
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">图片名称/标识</label>
            <input type="text" value={newImageName} onChange={(e) => setNewImageName(e.target.value)}
              placeholder="例: hero-banner" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">选择文件</label>
            <div className="flex gap-2">
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <button type="button" onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Upload className="w-4 h-4" />上传图片
              </button>
              {uploading && <Loader2 className="w-5 h-5 animate-spin text-primary-600 self-center" />}
            </div>
          </div>
        </div>
      </div>

      {imageItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">暂无图片</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {imageItems.map((img) => (
            <div key={img.key} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
              <div className="aspect-video bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getImageUrl(img.url)} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <a href={img.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-lg shadow-sm mr-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                  </a>
                  <button onClick={() => handleDeleteImage(img.key)} className="p-2 bg-white rounded-lg shadow-sm">
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

  /* ---------------------------------------------------------------- */
  /*  Render: Links Tab                                               */
  /* ---------------------------------------------------------------- */

  const renderLinksTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAddLink(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" />添加链接
        </button>
      </div>

      {showAddLink && (
        <ModalBackdrop onClose={() => setShowAddLink(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">添加链接</h3>
              <button onClick={() => setShowAddLink(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">标签</label>
                <input type="text" value={newLink.label} onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="例: LinkedIn" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">链接地址</label>
                <input type="url" value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">图标名称</label>
                <input type="text" value={newLink.icon} onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                  placeholder="例: linkedin, facebook, globe" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowAddLink(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleAddLink} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}添加
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {linkItems.length === 0 ? (
          <div className="p-12 text-center">
            <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无链接</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">标签</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">链接地址</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">图标</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {linkItems.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editingLink === item.key ? (
                        <input type="text" value={editingLinkData.label} onChange={(e) => setEditingLinkData({ ...editingLinkData, label: e.target.value })}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm" />
                      ) : (
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {editingLink === item.key ? (
                        <input type="url" value={editingLinkData.url} onChange={(e) => setEditingLinkData({ ...editingLinkData, url: e.target.value })}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm" />
                      ) : (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline truncate block">{item.url}</a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingLink === item.key ? (
                        <input type="text" value={editingLinkData.icon} onChange={(e) => setEditingLinkData({ ...editingLinkData, icon: e.target.value })}
                          className="w-full px-2 py-1 border border-primary-300 rounded text-sm" />
                      ) : (
                        <span className="text-sm text-gray-500">{item.icon || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleLink(item)} disabled={saving} className="flex items-center gap-1.5"
                        title={item.active ? '已启用' : '已禁用'}>
                        {item.active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                        <span className={`text-xs font-medium ${item.active ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.active ? '启用' : '禁用'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {editingLink === item.key ? (
                          <>
                            <button onClick={() => confirmEditLink(item.key)} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button onClick={() => setEditingLink(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditLink(item)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteLink(item.key)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
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

  /* ---------------------------------------------------------------- */
  /*  Render: Files Tab                                               */
  /* ---------------------------------------------------------------- */

  const renderFilesTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4" />上传文件
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">显示名称</label>
            <input type="text" value={newFileDisplayName} onChange={(e) => setNewFileDisplayName(e.target.value)}
              placeholder="例: 2024产品目录" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="w-full sm:w-40">
            <label className="block text-xs font-medium text-gray-500 mb-1">分类</label>
            <select value={newFileCategory} onChange={(e) => setNewFileCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
              <option value="catalog">目录</option>
              <option value="certification">认证</option>
              <option value="brochure">宣传册</option>
              <option value="manual">手册</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">选择文件</label>
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" onChange={handleFileUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Upload className="w-4 h-4" />上传文件
              </button>
              {uploadingFile && <Loader2 className="w-5 h-5 animate-spin text-primary-600 self-center" />}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {fileItems.length === 0 ? (
          <div className="p-12 text-center">
            <FolderDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">暂无文件</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">分类</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">文件名</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fileItems.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="text-sm font-medium text-gray-800">{item.displayName}</span></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 capitalize">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{item.originalName || item.url}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a href={item.url} download className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="下载">
                          <Download className="w-4 h-4" />
                        </a>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg" title="查看">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button onClick={() => handleDeleteFile(item.key)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除">
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
        <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
        <button
          onClick={() => { fetchSettings(); fetchNews(); fetchCases(); fetchCerts(); }}
          disabled={loading}
          className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
          title="刷新"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-red-50 text-red-600 mb-1"><Newspaper className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{newsItems.length}</p>
          <p className="text-xs text-gray-500">新闻资讯</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-indigo-50 text-indigo-600 mb-1"><Briefcase className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{caseItems.length}</p>
          <p className="text-xs text-gray-500">客户案例</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-amber-50 text-amber-600 mb-1"><Award className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{certItems.length}</p>
          <p className="text-xs text-gray-500">资质证书</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-blue-50 text-blue-600 mb-1"><FileText className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{contentItems.length}</p>
          <p className="text-xs text-gray-500">页面内容</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-green-50 text-green-600 mb-1"><ImageIcon className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{imageItems.length}</p>
          <p className="text-xs text-gray-500">图片</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-orange-50 text-orange-600 mb-1"><Link2 className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{linkItems.length}</p>
          <p className="text-xs text-gray-500">链接</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
          <div className="inline-flex p-1.5 rounded-lg bg-purple-50 text-purple-600 mb-1"><FolderDown className="w-4 h-4" /></div>
          <p className="text-xl font-bold text-gray-900">{fileItems.length}</p>
          <p className="text-xs text-gray-500">文件</p>
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
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="p-4 lg:p-6">
          {activeTab === 'news' && renderNewsTab()}
          {activeTab === 'cases' && renderCasesTab()}
          {activeTab === 'certificates' && renderCertificatesTab()}
          {activeTab === 'content' && renderContentTab()}
          {activeTab === 'images' && renderImagesTab()}
          {activeTab === 'links' && renderLinksTab()}
          {activeTab === 'files' && renderFilesTab()}
        </div>
      </div>
    </div>
  );
}
