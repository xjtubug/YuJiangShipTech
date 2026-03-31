'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-utils';
import toast from 'react-hot-toast';
import {
  Building2,
  Users,
  FileText,
  MapPin,
  Factory,
  Plus,
  Pencil,
  Trash2,
  Save,
  Loader2,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  Film,
  Briefcase,
  Search,
  AlertTriangle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface AboutSection {
  id?: string;
  section: string;
  titleEn: string;
  titleZh: string;
  contentEn: string;
  contentZh: string;
  images: string;
  videoUrl: string | null;
  pdfUrl: string | null;
  extraJson: string;
  sortOrder: number;
}

interface TeamMemberType {
  id?: string;
  nameEn: string;
  nameZh: string;
  titleEn: string;
  titleZh: string;
  avatar: string | null;
  bio: string | null;
  sortOrder: number;
}

interface CaseStudyType {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  clientName: string;
  clientLogo: string | null;
  country: string;
  image: string | null;
  images: string;
  videoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  contentEn: string;
  contentZh: string;
  rating: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const SECTION_CONFIG: {
  key: string;
  label: string;
  icon: React.ReactNode;
  fields: string[];
}[] = [
  {
    key: 'intro',
    label: '公司简介',
    icon: <Building2 className="w-5 h-5" />,
    fields: ['titleEn', 'titleZh', 'contentEn', 'contentZh', 'images', 'videoUrl'],
  },
  {
    key: 'factory',
    label: '工厂展示',
    icon: <Factory className="w-5 h-5" />,
    fields: ['images', 'videoUrl'],
  },
  {
    key: 'location',
    label: '位置信息',
    icon: <MapPin className="w-5 h-5" />,
    fields: ['extraJson'],
  },
  {
    key: 'team',
    label: '团队成员',
    icon: <Users className="w-5 h-5" />,
    fields: ['teamMembers'],
  },
  {
    key: 'pdf',
    label: 'PDF资料',
    icon: <FileText className="w-5 h-5" />,
    fields: ['pdfUrl'],
  },
];

const EMPTY_SECTION: AboutSection = {
  section: '',
  titleEn: '',
  titleZh: '',
  contentEn: '',
  contentZh: '',
  images: '[]',
  videoUrl: null,
  pdfUrl: null,
  extraJson: '{}',
  sortOrder: 0,
};

const EMPTY_MEMBER: TeamMemberType = {
  nameEn: '',
  nameZh: '',
  titleEn: '',
  titleZh: '',
  avatar: null,
  bio: null,
  sortOrder: 0,
};

const EMPTY_CASE: Omit<CaseStudyType, 'id' | 'slug' | 'createdAt'> = {
  titleEn: '',
  titleZh: '',
  clientName: '',
  clientLogo: null,
  country: '',
  image: null,
  images: '[]',
  videoUrl: null,
  latitude: null,
  longitude: null,
  locationName: null,
  contentEn: '',
  contentZh: '',
  rating: 5,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function parseImages(imagesStr: string): string[] {
  try {
    const arr = JSON.parse(imagesStr);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseExtraJson(json: string): Record<string, string> {
  try {
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
}

async function uploadFile(file: File, category: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  const data = await res.json();
  return data.url;
}

/* ------------------------------------------------------------------ */
/*  Image Upload Component                                            */
/* ------------------------------------------------------------------ */

function ImageUploader({
  images,
  onChange,
  category = 'about',
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  category?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadFile(file, category);
        urls.push(url);
      }
      onChange([...images, ...urls]);
      toast.success(`${urls.length} 张图片上传成功`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {images.map((url, idx) => (
          <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
            <Image
              src={getImageUrl(url)}
              alt={`Image ${idx + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {uploading ? '上传中...' : '上传图片'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirm Modal                                              */
/* ------------------------------------------------------------------ */

function DeleteConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
  deleting,
}: {
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">此操作无法撤销。</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Team Member Edit Card                                             */
/* ------------------------------------------------------------------ */

function TeamMemberCard({
  member,
  onChange,
  onDelete,
}: {
  member: TeamMemberType;
  onChange: (m: TeamMemberType) => void;
  onDelete: () => void;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadFile(file, 'avatar');
      onChange({ ...member, avatar: url });
      toast.success('头像上传成功');
    } catch {
      toast.error('头像上传失败');
    } finally {
      setAvatarUploading(false);
      if (avatarRef.current) avatarRef.current.value = '';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-500 transition-colors"
            onClick={() => avatarRef.current?.click()}
          >
            {avatarUploading ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : member.avatar ? (
              <Image src={getImageUrl(member.avatar)} alt="" width={64} height={64} className="object-cover w-full h-full" unoptimized />
            ) : (
              <Users className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>

        {/* Fields */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">英文名</label>
            <input
              value={member.nameEn}
              onChange={(e) => onChange({ ...member, nameEn: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="English Name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">中文名</label>
            <input
              value={member.nameZh}
              onChange={(e) => onChange({ ...member, nameZh: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="中文姓名"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">英文职位</label>
            <input
              value={member.titleEn}
              onChange={(e) => onChange({ ...member, titleEn: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Title (EN)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">中文职位</label>
            <input
              value={member.titleZh}
              onChange={(e) => onChange({ ...member, titleZh: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="职位 (ZH)"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">简介</label>
            <textarea
              value={member.bio || ''}
              onChange={(e) => onChange({ ...member, bio: e.target.value || null })}
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="个人简介..."
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">排序</label>
            <input
              type="number"
              value={member.sortOrder}
              onChange={(e) => onChange({ ...member, sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={onDelete}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="删除成员"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Case Study Modal                                                  */
/* ------------------------------------------------------------------ */

function CaseStudyModal({
  caseStudy,
  onClose,
  onSaved,
}: {
  caseStudy: CaseStudyType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!caseStudy?.id;
  const [form, setForm] = useState(() => {
    if (caseStudy) return { ...caseStudy };
    return { ...EMPTY_CASE } as Omit<CaseStudyType, 'id' | 'slug' | 'createdAt'> & { id?: string };
  });
  const [saving, setSaving] = useState(false);
  const [caseImages, setCaseImages] = useState<string[]>(() =>
    parseImages(caseStudy?.images || '[]')
  );

  const handleSave = async () => {
    if (!form.titleEn && !form.titleZh) {
      toast.error('请输入案例标题');
      return;
    }
    if (!form.clientName) {
      toast.error('请输入客户名称');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        images: JSON.stringify(caseImages),
        image: caseImages[0] || null,
      };

      const res = await fetch('/api/admin/about/cases', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '操作失败' }));
        throw new Error(err.error);
      }

      toast.success(isEdit ? '案例已更新' : '案例已创建');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? '编辑案例' : '新建案例'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                英文标题 *
              </label>
              <input
                value={form.titleEn}
                onChange={(e) => setField('titleEn', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Title (EN)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                中文标题 *
              </label>
              <input
                value={form.titleZh}
                onChange={(e) => setField('titleZh', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="标题 (ZH)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                客户名称 *
              </label>
              <input
                value={form.clientName}
                onChange={(e) => setField('clientName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Client Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                国家/地区
              </label>
              <input
                value={form.country}
                onChange={(e) => setField('country', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Country"
              />
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              案例图片
            </label>
            <ImageUploader
              images={caseImages}
              onChange={setCaseImages}
              category="case-study"
            />
          </div>

          {/* Video & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                视频链接
              </label>
              <input
                value={form.videoUrl || ''}
                onChange={(e) => setField('videoUrl', e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                位置名称
              </label>
              <input
                value={form.locationName || ''}
                onChange={(e) => setField('locationName', e.target.value || null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Location Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                纬度 (Latitude)
              </label>
              <input
                type="number"
                step="any"
                value={form.latitude ?? ''}
                onChange={(e) =>
                  setField('latitude', e.target.value ? parseFloat(e.target.value) : null)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. 30.2741"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                经度 (Longitude)
              </label>
              <input
                type="number"
                step="any"
                value={form.longitude ?? ''}
                onChange={(e) =>
                  setField('longitude', e.target.value ? parseFloat(e.target.value) : null)
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. 120.1551"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              英文内容
            </label>
            <textarea
              value={form.contentEn}
              onChange={(e) => setField('contentEn', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Content (EN)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              中文内容
            </label>
            <textarea
              value={form.contentZh}
              onChange={(e) => setField('contentZh', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="内容 (ZH)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? '更新' : '创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */

export default function AboutManagePage() {
  const [activeTab, setActiveTab] = useState<'about' | 'cases'>('about');

  // About state
  const [sections, setSections] = useState<Record<string, AboutSection>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMemberType[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['intro'])
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'member' | 'case';
    id: string;
    name: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cases state
  const [cases, setCases] = useState<CaseStudyType[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesSearch, setCasesSearch] = useState('');
  const [casesPage, setCasesPage] = useState(1);
  const [casesTotal, setCasesTotal] = useState(0);
  const [editingCase, setEditingCase] = useState<CaseStudyType | null | 'new'>(
    null
  );

  // PDF upload
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfUploading, setPdfUploading] = useState(false);

  /* ---------- Fetch About Data ---------- */

  const fetchAbout = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/about');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();

      const sectionMap: Record<string, AboutSection> = {};
      for (const cfg of SECTION_CONFIG) {
        const found = (data.sections || []).find(
          (s: AboutSection) => s.section === cfg.key
        );
        sectionMap[cfg.key] = found || { ...EMPTY_SECTION, section: cfg.key };
      }
      setSections(sectionMap);
      setTeamMembers(data.teamMembers || []);
    } catch {
      toast.error('加载关于我们数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------- Fetch Cases Data ---------- */

  const fetchCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const params = new URLSearchParams({
        page: casesPage.toString(),
        limit: '20',
      });
      if (casesSearch) params.set('search', casesSearch);

      const res = await fetch(`/api/admin/about/cases?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCases(data.items || []);
      setCasesTotal(data.total || 0);
    } catch {
      toast.error('加载案例数据失败');
    } finally {
      setCasesLoading(false);
    }
  }, [casesPage, casesSearch]);

  useEffect(() => {
    fetchAbout();
  }, [fetchAbout]);

  useEffect(() => {
    if (activeTab === 'cases') {
      fetchCases();
    }
  }, [activeTab, fetchCases]);

  /* ---------- Section Helpers ---------- */

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const updateSectionField = (
    sectionKey: string,
    field: string,
    value: string | null
  ) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [field]: value },
    }));
  };

  /* ---------- Save Section ---------- */

  const saveSection = async (sectionKey: string) => {
    setSavingSection(sectionKey);
    try {
      const payload: {
        sections?: AboutSection[];
        teamMembers?: TeamMemberType[];
      } = {};

      if (sectionKey === 'team') {
        payload.teamMembers = teamMembers;
      } else {
        payload.sections = [sections[sectionKey]];
      }

      const res = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '保存失败' }));
        throw new Error(err.error);
      }

      const data = await res.json();

      // Update local state from response
      const sectionMap: Record<string, AboutSection> = { ...sections };
      for (const s of data.sections || []) {
        if (sectionMap[s.section]) sectionMap[s.section] = s;
      }
      setSections(sectionMap);
      if (data.teamMembers) setTeamMembers(data.teamMembers);

      toast.success('保存成功');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSavingSection(null);
    }
  };

  /* ---------- Delete Member ---------- */

  const handleDeleteMember = async (memberId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/about?memberId=${encodeURIComponent(memberId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('删除失败');
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success('成员已删除');
      setDeleteTarget(null);
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- Delete Case ---------- */

  const handleDeleteCase = async (caseId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/about/cases?id=${encodeURIComponent(caseId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('删除失败');
      toast.success('案例已删除');
      setDeleteTarget(null);
      fetchCases();
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- PDF Upload ---------- */

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('请上传 PDF 文件');
      return;
    }
    setPdfUploading(true);
    try {
      const url = await uploadFile(file, 'document');
      updateSectionField('pdf', 'pdfUrl', url);
      toast.success('PDF 上传成功');
    } catch {
      toast.error('PDF 上传失败');
    } finally {
      setPdfUploading(false);
      if (pdfRef.current) pdfRef.current.value = '';
    }
  };

  /* ---------- Render Section Content ---------- */

  const renderSectionFields = (cfg: (typeof SECTION_CONFIG)[number]) => {
    const sec = sections[cfg.key];
    if (!sec) return null;

    switch (cfg.key) {
      case 'intro':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  英文标题
                </label>
                <input
                  value={sec.titleEn}
                  onChange={(e) =>
                    updateSectionField('intro', 'titleEn', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Title (EN)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  中文标题
                </label>
                <input
                  value={sec.titleZh}
                  onChange={(e) =>
                    updateSectionField('intro', 'titleZh', e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="标题 (ZH)"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                英文内容
              </label>
              <textarea
                value={sec.contentEn}
                onChange={(e) =>
                  updateSectionField('intro', 'contentEn', e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Content (EN)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                中文内容
              </label>
              <textarea
                value={sec.contentZh}
                onChange={(e) =>
                  updateSectionField('intro', 'contentZh', e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="内容 (ZH)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片
              </label>
              <ImageUploader
                images={parseImages(sec.images)}
                onChange={(imgs) =>
                  updateSectionField('intro', 'images', JSON.stringify(imgs))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                视频链接
              </label>
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-gray-400" />
                <input
                  value={sec.videoUrl || ''}
                  onChange={(e) =>
                    updateSectionField(
                      'intro',
                      'videoUrl',
                      e.target.value || null
                    )
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        );

      case 'factory':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工厂图片
              </label>
              <ImageUploader
                images={parseImages(sec.images)}
                onChange={(imgs) =>
                  updateSectionField('factory', 'images', JSON.stringify(imgs))
                }
                category="factory"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                视频链接
              </label>
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-gray-400" />
                <input
                  value={sec.videoUrl || ''}
                  onChange={(e) =>
                    updateSectionField(
                      'factory',
                      'videoUrl',
                      e.target.value || null
                    )
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        );

      case 'location': {
        const extra = parseExtraJson(sec.extraJson);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  纬度 (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={extra.latitude || ''}
                  onChange={(e) =>
                    updateSectionField(
                      'location',
                      'extraJson',
                      JSON.stringify({
                        ...extra,
                        latitude: e.target.value,
                      })
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. 30.2741"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  经度 (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={extra.longitude || ''}
                  onChange={(e) =>
                    updateSectionField(
                      'location',
                      'extraJson',
                      JSON.stringify({
                        ...extra,
                        longitude: e.target.value,
                      })
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g. 120.1551"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  位置名称
                </label>
                <input
                  value={extra.locationName || ''}
                  onChange={(e) =>
                    updateSectionField(
                      'location',
                      'extraJson',
                      JSON.stringify({
                        ...extra,
                        locationName: e.target.value,
                      })
                    )
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="位置名称"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              <MapPin className="w-3 h-3 inline mr-1" />
              输入 Google Maps 坐标用于在地图上显示公司位置
            </p>
          </div>
        );
      }

      case 'team':
        return (
          <div className="space-y-3">
            {teamMembers.map((member, idx) => (
              <TeamMemberCard
                key={member.id || `new-${idx}`}
                member={member}
                onChange={(updated) => {
                  setTeamMembers((prev) =>
                    prev.map((m, i) => (i === idx ? updated : m))
                  );
                }}
                onDelete={() => {
                  if (member.id) {
                    setDeleteTarget({
                      type: 'member',
                      id: member.id,
                      name: member.nameZh || member.nameEn,
                    });
                  } else {
                    setTeamMembers((prev) => prev.filter((_, i) => i !== idx));
                  }
                }}
              />
            ))}
            <button
              onClick={() =>
                setTeamMembers((prev) => [
                  ...prev,
                  { ...EMPTY_MEMBER, sortOrder: prev.length },
                ])
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加成员
            </button>
          </div>
        );

      case 'pdf':
        return (
          <div className="space-y-4">
            {sec.pdfUrl && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-red-500" />
                <a
                  href={getImageUrl(sec.pdfUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:underline truncate flex-1"
                >
                  {sec.pdfUrl}
                </a>
                <button
                  onClick={() => updateSectionField('pdf', 'pdfUrl', null)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => pdfRef.current?.click()}
              disabled={pdfUploading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 disabled:opacity-50"
            >
              {pdfUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {pdfUploading ? '上传中...' : '上传 PDF'}
            </button>
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />
          </div>
        );

      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">关于我们管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理公司简介、工厂展示、团队成员和工程案例
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'about'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-1.5" />
            关于我们
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cases'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4 inline mr-1.5" />
            工程案例
          </button>
        </nav>
      </div>

      {/* Tab 1: About Us */}
      {activeTab === 'about' && (
        <div className="space-y-4">
          {SECTION_CONFIG.map((cfg) => (
            <div
              key={cfg.key}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(cfg.key)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary-600">{cfg.icon}</div>
                  <span className="font-medium text-gray-900">
                    {cfg.label}
                  </span>
                </div>
                {expandedSections.has(cfg.key) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Section Body */}
              {expandedSections.has(cfg.key) && (
                <div className="p-6">
                  {renderSectionFields(cfg)}

                  {/* Save Button */}
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => saveSection(cfg.key)}
                      disabled={savingSection === cfg.key}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {savingSection === cfg.key ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      保存{cfg.label}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Case Studies */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={casesSearch}
                onChange={(e) => {
                  setCasesSearch(e.target.value);
                  setCasesPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="搜索案例..."
              />
            </div>
            <button
              onClick={() => setEditingCase('new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建案例
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {casesLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">暂无案例数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">
                        案例标题
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">
                        客户名称
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">
                        国家/地区
                      </th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">
                        创建时间
                      </th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cases.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {c.image && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                  src={getImageUrl(c.image)}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {c.titleZh || c.titleEn}
                              </p>
                              {c.titleEn && c.titleZh && (
                                <p className="text-xs text-gray-500">
                                  {c.titleEn}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {c.clientName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {c.country}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setEditingCase(c)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteTarget({
                                  type: 'case',
                                  id: c.id,
                                  name: c.titleZh || c.titleEn,
                                })
                              }
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
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

            {/* Pagination */}
            {casesTotal > 20 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-500">
                  共 {casesTotal} 条记录
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCasesPage((p) => Math.max(1, p - 1))}
                    disabled={casesPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-600">
                    第 {casesPage} 页 / 共{' '}
                    {Math.ceil(casesTotal / 20)} 页
                  </span>
                  <button
                    onClick={() =>
                      setCasesPage((p) =>
                        Math.min(Math.ceil(casesTotal / 20), p + 1)
                      )
                    }
                    disabled={casesPage >= Math.ceil(casesTotal / 20)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case Study Modal */}
      {editingCase !== null && (
        <CaseStudyModal
          caseStudy={editingCase === 'new' ? null : editingCase}
          onClose={() => setEditingCase(null)}
          onSaved={() => {
            setEditingCase(null);
            fetchCases();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={
            deleteTarget.type === 'member' ? '删除团队成员' : '删除工程案例'
          }
          message={`确定要删除「${deleteTarget.name}」吗？`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget.type === 'member') {
              handleDeleteMember(deleteTarget.id);
            } else {
              handleDeleteCase(deleteTarget.id);
            }
          }}
          deleting={deleting}
        />
      )}
    </div>
  );
}
