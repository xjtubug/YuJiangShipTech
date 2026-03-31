'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { FileText, Upload, Loader2 } from 'lucide-react';

export default function FileUploadField({
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
