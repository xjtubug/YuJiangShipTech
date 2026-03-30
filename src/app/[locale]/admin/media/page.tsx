'use client';

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Upload,
  Trash2,
  Search,
  Grid3X3,
  List,
  Copy,
  CheckCircle2,
  X,
  Film,
  FileText,
  Image as ImageIcon,
  HardDrive,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatFileSize, isImageFile, isVideoFile, getImageUrl } from '@/lib/image-utils';

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  category: string;
  alt?: string | null;
  createdBy: string;
  createdAt: string;
}

interface Stats {
  totalFiles: number;
  totalSize: number;
  imageCount: number;
  videoCount: number;
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'product', label: '产品' },
  { key: 'news', label: '新闻' },
  { key: 'certificate', label: '证书' },
  { key: 'document', label: '文档' },
  { key: 'avatar', label: '头像' },
  { key: 'general', label: '通用' },
];

const CATEGORY_COLORS: Record<string, string> = {
  product: 'bg-blue-100 text-blue-700',
  news: 'bg-green-100 text-green-700',
  certificate: 'bg-yellow-100 text-yellow-700',
  document: 'bg-purple-100 text-purple-700',
  avatar: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-600',
};

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalFiles: 0, totalSize: 0, imageCount: 0, videoCount: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ name: string; done: boolean }[]>([]);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [dragOver, setDragOver] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '24', category, search });
      const res = await fetch(`/api/admin/media?${params}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } catch {
      toast.error('加载媒体文件失败');
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Upload files
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    const progress = files.map((f) => ({ name: f.name, done: false }));
    setUploadProgress(progress);

    for (let i = 0; i < files.length; i++) {
      const fd = new FormData();
      fd.append('file', files[i]);
      fd.append('category', uploadCategory);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json();
          toast.error(`${files[i].name}: ${err.error}`);
        }
      } catch {
        toast.error(`上传失败: ${files[i].name}`);
      }
      progress[i].done = true;
      setUploadProgress([...progress]);
    }

    setUploading(false);
    setUploadProgress([]);
    setPreviewFiles([]);
    toast.success(`已上传 ${files.length} 个文件`);
    fetchMedia();
  };

  // File input handler
  const onFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const previews = files.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }));
    setPreviewFiles(previews);
  };

  // Drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onFilesSelected(e.dataTransfer.files);
  };

  // Delete
  const handleDelete = async (ids: string[]) => {
    if (!confirm(`确定删除 ${ids.length} 个文件？此操作不可撤销。`)) return;
    try {
      const res = await fetch(`/api/admin/media?ids=${ids.join(',')}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(`已删除 ${ids.length} 个文件`);
      setSelected(new Set());
      fetchMedia();
      if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
    } catch {
      toast.error('删除失败');
    }
  };

  // Bulk category change
  const handleBulkCategory = async () => {
    if (!bulkCategory || selected.size === 0) return;
    try {
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), category: bulkCategory }),
      });
      if (!res.ok) throw new Error();
      toast.success('分类已更新');
      setSelected(new Set());
      setBulkCategory('');
      fetchMedia();
    } catch {
      toast.error('更新分类失败');
    }
  };

  // Copy URL
  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL 已复制');
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  // Thumbnail renderer
  const renderThumb = (item: MediaItem, size: 'sm' | 'lg' = 'sm') => {
    const cls = size === 'lg' ? 'w-full h-48 object-cover rounded-lg' : 'w-10 h-10 object-cover rounded';
    if (isImageFile(item.mimeType)) {
      return <img src={getImageUrl(item.url)} alt={item.alt || item.originalName} className={cls} loading="lazy" />;
    }
    if (isVideoFile(item.mimeType)) {
      return (
        <div className={`${size === 'lg' ? 'w-full h-48' : 'w-10 h-10'} bg-gray-100 rounded flex items-center justify-center`}>
          <Film className={size === 'lg' ? 'w-12 h-12 text-gray-400' : 'w-5 h-5 text-gray-400'} />
        </div>
      );
    }
    return (
      <div className={`${size === 'lg' ? 'w-full h-48' : 'w-10 h-10'} bg-gray-100 rounded flex items-center justify-center`}>
        <FileText className={size === 'lg' ? 'w-12 h-12 text-gray-400' : 'w-5 h-5 text-gray-400'} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">媒体管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理所有上传的文件和图片</p>
        </div>
        <button onClick={fetchMedia} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="刷新">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '总文件数', value: stats.totalFiles, icon: FolderOpen, color: 'text-blue-600 bg-blue-50' },
          { label: '总大小', value: formatFileSize(stats.totalSize), icon: HardDrive, color: 'text-green-600 bg-green-50' },
          { label: '图片', value: stats.imageCount, icon: ImageIcon, color: 'text-purple-600 bg-purple-50' },
          { label: '视频', value: stats.videoCount, icon: Film, color: 'text-orange-600 bg-orange-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-semibold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">上传文件</h2>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <label className="text-xs font-medium text-gray-600">分类:</label>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">拖拽文件到此处，或点击选择文件</p>
          <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG, WebP, PDF, DOC, MP4 等格式，最大 10MB（视频 50MB）</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFilesSelected(e.target.files)}
          />
        </div>

        {/* Preview before upload */}
        {previewFiles.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">待上传 ({previewFiles.length} 个文件)</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewFiles([])}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => handleUpload(previewFiles.map((p) => p.file))}
                  disabled={uploading}
                  className="px-4 py-1.5 text-xs rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploading ? '上传中...' : '开始上传'}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {previewFiles.map((pf, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                  {pf.preview ? (
                    <img src={pf.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-8 h-8 text-gray-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFiles((prev) => prev.filter((_, j) => j !== i));
                    }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 truncate">{pf.file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-3 space-y-1">
            {uploadProgress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {p.done ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                )}
                <span className="text-gray-600 truncate">{p.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar: Search, Filters, View Toggle, Bulk Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="搜索文件名..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => { setCategory(c.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === c.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">已选择 {selected.size} 项</span>
            <button
              onClick={() => handleDelete(Array.from(selected))}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100"
            >
              <Trash2 className="w-3.5 h-3.5 inline mr-1" />
              批量删除
            </button>
            <div className="flex items-center gap-1">
              <select
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
              >
                <option value="">修改分类...</option>
                {CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
              {bulkCategory && (
                <button onClick={handleBulkCategory} className="px-3 py-1.5 text-xs rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
                  应用
                </button>
              )}
            </div>
            <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 hover:underline ml-auto">
              取消选择
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">暂无媒体文件</p>
          <p className="text-xs text-gray-400 mt-1">上传文件后将在此处显示</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md cursor-pointer ${
                selected.has(item.id) ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
              }`}
            >
              {/* Checkbox & Preview */}
              <div className="relative" onClick={() => setDetailItem(item)}>
                {renderThumb(item, 'lg')}
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 left-2 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 opacity-0 group-hover:opacity-100 transition-opacity checked:opacity-100"
                />
                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }}
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-50"
                    title="复制URL"
                  >
                    <Copy className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete([item.id]); }}
                    className="p-2 bg-white rounded-full shadow hover:bg-red-50"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-medium text-gray-800 truncate" title={item.originalName}>
                  {item.originalName}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}`}>
                    {CATEGORIES.find((c) => c.key === item.category)?.label || item.category}
                  </span>
                  <span className="text-[10px] text-gray-400">{formatFileSize(item.size)}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">预览</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">类型</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">大小</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">分类</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">日期</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${selected.has(item.id) ? 'bg-primary-50' : ''}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-3 py-2">{renderThumb(item, 'sm')}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setDetailItem(item)} className="text-sm font-medium text-gray-800 hover:text-primary-600 truncate max-w-[200px] block text-left">
                      {item.originalName}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500 hidden md:table-cell">{item.mimeType.split('/')[1]}</td>
                  <td className="px-3 py-2 text-xs text-gray-500 hidden sm:table-cell">{formatFileSize(item.size)}</td>
                  <td className="px-3 py-2 hidden lg:table-cell">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.general}`}>
                      {CATEGORIES.find((c) => c.key === item.category)?.label || item.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400 hidden lg:table-cell">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setDetailItem(item)} className="p-1.5 rounded hover:bg-gray-100" title="查看">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => copyUrl(item.url)} className="p-1.5 rounded hover:bg-gray-100" title="复制URL">
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete([item.id])} className="p-1.5 rounded hover:bg-red-50" title="删除">
                        <Trash2 className="w-4 h-4 text-red-500" />
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 {total} 个文件，第 {page}/{totalPages} 页
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${
                    p === page ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{detailItem.originalName}</h3>
              <button onClick={() => setDetailItem(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {/* Preview */}
              <div className="mb-6 bg-gray-50 rounded-xl p-4 flex items-center justify-center min-h-[200px]">
                {isImageFile(detailItem.mimeType) ? (
                  <img src={getImageUrl(detailItem.url)} alt={detailItem.alt || detailItem.originalName} className="max-w-full max-h-[400px] rounded-lg object-contain" />
                ) : isVideoFile(detailItem.mimeType) ? (
                  <video src={getImageUrl(detailItem.url)} controls className="max-w-full max-h-[400px] rounded-lg" />
                ) : (
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">文档文件</p>
                  </div>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">文件名</p>
                  <p className="text-gray-800 font-medium truncate">{detailItem.originalName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">类型</p>
                  <p className="text-gray-800">{detailItem.mimeType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">大小</p>
                  <p className="text-gray-800">{formatFileSize(detailItem.size)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">分类</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[detailItem.category] || CATEGORY_COLORS.general}`}>
                    {CATEGORIES.find((c) => c.key === detailItem.category)?.label || detailItem.category}
                  </span>
                </div>
                {detailItem.width && detailItem.height && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">尺寸</p>
                    <p className="text-gray-800">{detailItem.width} × {detailItem.height} px</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">上传时间</p>
                  <p className="text-gray-800">{new Date(detailItem.createdAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>

              {/* URL copy section */}
              <div className="mt-5 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1.5">文件 URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 text-gray-700 truncate">
                    {detailItem.url}
                  </code>
                  <button
                    onClick={() => copyUrl(detailItem.url)}
                    className="px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 flex items-center gap-1 flex-shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> 复制
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex items-center justify-end gap-3">
                <button
                  onClick={() => { handleDelete([detailItem.id]); }}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> 删除文件
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
