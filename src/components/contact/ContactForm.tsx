'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Send, Loader2, Paperclip, X } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.zip';

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactForm() {
  const t = useTranslations('contact');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 10MB');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setAttachmentUrl(data.url);
      setAttachmentName(file.name);
    } catch {
      toast.error('File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl('');
    setAttachmentName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, attachmentUrl: attachmentUrl || undefined }),
      });

      if (!res.ok) throw new Error('Failed');

      toast.success(t('formSuccess'));
      setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
      setAttachmentUrl('');
      setAttachmentName('');
    } catch {
      toast.error(t('formError'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-primary-200 bg-white text-primary-800 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-colors';
  const labelClass = 'block text-sm font-semibold text-primary-700 mb-1.5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="heading-3 mb-6">{t('formSubmit')}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              {t('formName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('formName')}
              className={inputClass}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              {t('formEmail')} <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={t('formEmail')}
              className={inputClass}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className={labelClass}>
              {t('formCompany')}
            </label>
            <input
              id="company"
              name="company"
              type="text"
              value={formData.company}
              onChange={handleChange}
              placeholder={t('formCompany')}
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className={labelClass}>
              {t('formPhone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder={t('formPhone')}
              className={inputClass}
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className={labelClass}>
            {t('formSubject')}
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={formData.subject}
            onChange={handleChange}
            placeholder={t('formSubject')}
            className={inputClass}
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className={labelClass}>
            {t('formMessage')} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            placeholder={t('formMessage')}
            className={inputClass + ' resize-none'}
          />
          {errors.message && (
            <p className="text-red-500 text-xs mt-1">{errors.message}</p>
          )}
        </div>

        {/* Attachment */}
        <div>
          <label className={labelClass}>📎 Attach file (optional)</label>
          {attachmentName ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary-200 bg-primary-50">
              <Paperclip className="w-4 h-4 text-primary-600 flex-shrink-0" />
              <span className="text-sm text-primary-700 truncate flex-1">{attachmentName}</span>
              <button
                type="button"
                onClick={removeAttachment}
                className="p-1 rounded-full hover:bg-primary-100 text-primary-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 w-full rounded-lg border-2 border-dashed border-primary-200 text-primary-400 hover:border-secondary-500 hover:text-secondary-600 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
              <span className="text-sm">
                {uploading ? 'Uploading...' : 'PDF, images, docs — max 10MB'}
              </span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelect}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {loading ? t('formSending') : t('formSubmit')}
        </button>
      </form>
    </motion.div>
  );
}
