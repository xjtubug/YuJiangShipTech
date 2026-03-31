'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus, Trash2, Upload, Send, Loader2, FileCheck, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInquiryStore } from '@/lib/store';

interface ProductOption {
  id: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  sku: string;
  categoryId: string;
}

interface CategoryOption {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  parentId: string | null;
  children?: CategoryOption[];
}

interface ProductItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  specs: string;
  categoryId: string;
}

interface CompanyInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
}

interface FormErrors {
  companyName?: string;
  contactName?: string;
  email?: string;
  items?: string;
}

interface QuoteFormProps {
  products: ProductOption[];
  categories: CategoryOption[];
}

const UNITS = ['pcs', 'sets', 'meters', 'kg', 'tons'];

const COUNTRIES = [
  'China', 'Japan', 'South Korea', 'Singapore', 'India', 'Indonesia',
  'Vietnam', 'Thailand', 'Malaysia', 'Philippines', 'Turkey', 'Greece',
  'Norway', 'Germany', 'Netherlands', 'United Kingdom', 'United States',
  'Brazil', 'UAE', 'Saudi Arabia', 'Egypt', 'South Africa', 'Nigeria',
  'Russia', 'Australia', 'Other',
];

type LocaleNameField = 'nameEn' | 'nameZh' | 'nameJa' | 'nameAr';

const nameFieldMap: Record<string, LocaleNameField> = {
  en: 'nameEn',
  zh: 'nameZh',
  ja: 'nameJa',
  ar: 'nameAr',
};

export default function QuoteForm({ products, categories }: QuoteFormProps) {
  const t = useTranslations('inquiry');
  const locale = useLocale();
  const inquiryStore = useInquiryStore();

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: '',
  });

  const [items, setItems] = useState<ProductItem[]>([
    { productId: '', productName: '', quantity: 1, unit: 'pcs', specs: '', categoryId: '' },
  ]);

  const [techRequirements, setTechRequirements] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryRef, setInquiryRef] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build a flat list of all category IDs (including subcategories) for lookup
  const allCategories = useMemo(() => {
    const flat: CategoryOption[] = [];
    for (const cat of categories) {
      flat.push(cat);
      if (cat.children) {
        for (const child of cat.children) {
          flat.push(child);
        }
      }
    }
    return flat;
  }, [categories]);

  // Map from product ID to its categoryId for pre-populating category from store
  const productCategoryMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of products) {
      m.set(p.id, p.categoryId);
    }
    return m;
  }, [products]);

  // Pre-populate from inquiry store
  useEffect(() => {
    if (inquiryStore.items.length > 0) {
      const storeItems: ProductItem[] = inquiryStore.items.map((si) => ({
        productId: si.productId,
        productName: si.productName,
        quantity: si.quantity,
        unit: si.unit,
        specs: si.specs || '',
        categoryId: productCategoryMap.get(si.productId) || '',
      }));
      setItems(storeItems);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getLocalizedName = (item: { nameEn: string; nameZh: string; nameJa: string; nameAr: string }): string => {
    const field = nameFieldMap[locale] || 'nameEn';
    return item[field] || item.nameEn;
  };

  // Get products filtered by categoryId (includes subcategory products)
  const getProductsForCategory = (categoryId: string): ProductOption[] => {
    if (!categoryId) return [];
    // Collect the selected category + its children IDs
    const cat = allCategories.find((c) => c.id === categoryId);
    if (!cat) return [];
    const ids = new Set<string>([cat.id]);
    // If it's a parent category, include children
    const parentCat = categories.find((c) => c.id === categoryId);
    if (parentCat?.children) {
      for (const child of parentCat.children) {
        ids.add(child.id);
      }
    }
    return products.filter((p) => ids.has(p.categoryId));
  };

  const handleCompanyChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCompanyInfo((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof ProductItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleCategorySelect = (index: number, categoryId: string) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, categoryId, productId: '', productName: '' }
          : item
      )
    );
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              productId,
              productName: product ? getLocalizedName(product) : '',
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', productName: '', quantity: 1, unit: 'pcs', specs: '', categoryId: '' },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!companyInfo.companyName.trim()) newErrors.companyName = t('requiredField');
    if (!companyInfo.contactName.trim()) newErrors.contactName = t('requiredField');
    if (!companyInfo.email.trim()) {
      newErrors.email = t('requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyInfo.email)) {
      newErrors.email = t('invalidEmail');
    }

    const hasValidItem = items.some(
      (item) => item.productName.trim() || item.productId
    );
    if (!hasValidItem) newErrors.items = t('requiredField');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const payload = {
        ...companyInfo,
        items: items
          .filter((item) => item.productName.trim() || item.productId)
          .map((item) => ({
            productId: item.productId || undefined,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            specs: item.specs || undefined,
          })),
        techRequirements: techRequirements || undefined,
        message: message || undefined,
        attachmentUrl: attachmentUrl || undefined,
      };

      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      toast.success(locale === 'zh' ? '提交成功！' : 'Submitted!', { duration: 3000 });
      setInquiryRef(data.inquiryNumber || '');
      setSubmitted(true);

      // Clear form and store
      setCompanyInfo({ companyName: '', contactName: '', email: '', phone: '', country: '' });
      setItems([{ productId: '', productName: '', quantity: 1, unit: 'pcs', specs: '', categoryId: '' }]);
      setTechRequirements('');
      setMessage('');
      setAttachmentUrl('');
      setAttachmentName('');
      inquiryStore.clear();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast.error(locale === 'zh' ? '请求超时，请检查网络后重试' : 'Request timed out. Please try again.');
      } else {
        toast.error(t('submitError'));
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-lg border border-primary-200 bg-white text-primary-800 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-colors';
  const labelClass = 'block text-sm font-semibold text-primary-700 mb-1.5';

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileCheck className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{locale === 'zh' ? '询价已成功提交！' : 'Inquiry Submitted Successfully!'}</h2>
        {inquiryRef && (
          <p className="text-lg text-secondary-600 font-semibold mb-2">{locale === 'zh' ? '参考编号' : 'Reference'}: {inquiryRef}</p>
        )}
        <p className="text-gray-500 mb-8 max-w-md mx-auto">{locale === 'zh' ? '我们的销售团队将在24小时内与您联系。' : 'Our sales team will contact you within 24 hours.'}</p>
        <button type="button" onClick={() => { setSubmitted(false); setInquiryRef(''); }} className="btn-primary gap-2">
          <Plus className="w-4 h-4" />{locale === 'zh' ? '提交新询价' : 'Submit New Inquiry'}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ── Company Information ── */}
        <div>
          <h2 className="heading-3 mb-6 pb-3 border-b border-primary-100">
            Company Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="companyName" className={labelClass}>
                {t('companyName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={companyInfo.companyName}
                onChange={handleCompanyChange}
                placeholder={t('companyName')}
                className={inputClass}
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactName" className={labelClass}>
                {t('contactName')} <span className="text-red-500">*</span>
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={companyInfo.contactName}
                onChange={handleCompanyChange}
                placeholder={t('contactName')}
                className={inputClass}
              />
              {errors.contactName && (
                <p className="text-red-500 text-xs mt-1">{errors.contactName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                {t('email')} <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={companyInfo.email}
                onChange={handleCompanyChange}
                placeholder={t('email')}
                className={inputClass}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                {t('phone')}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={companyInfo.phone}
                onChange={handleCompanyChange}
                placeholder={t('phone')}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="country" className={labelClass}>
                {t('country')}
              </label>
              <select
                id="country"
                name="country"
                value={companyInfo.country}
                onChange={handleCompanyChange}
                className={inputClass}
              >
                <option value="">{t('country')}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Product Items ── */}
        <div>
          <h2 className="heading-3 mb-6 pb-3 border-b border-primary-100">
            {t('productName')}
          </h2>

          <div className="space-y-6">
            {items.map((item, index) => {
              const filteredProducts = getProductsForCategory(item.categoryId);

              return (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-primary-50 border border-primary-100 relative"
                >
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={t('removeProduct')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Two-level product selection: Category → Product */}
                    {categories.length > 0 && (
                      <>
                        {/* Level 1: Category */}
                        <div>
                          <label className={labelClass}>
                            {t('selectCategory')}
                          </label>
                          <select
                            value={item.categoryId}
                            onChange={(e) => handleCategorySelect(index, e.target.value)}
                            className={inputClass}
                          >
                            <option value="">{t('selectCategoryPlaceholder')}</option>
                            {categories.map((cat) => (
                              cat.children && cat.children.length > 0 ? (
                                <optgroup key={cat.id} label={getLocalizedName(cat)}>
                                  <option value={cat.id}>
                                    {getLocalizedName(cat)} ({t('allInCategory')})
                                  </option>
                                  {cat.children.map((child) => (
                                    <option key={child.id} value={child.id}>
                                      &nbsp;&nbsp;{getLocalizedName(child)}
                                    </option>
                                  ))}
                                </optgroup>
                              ) : (
                                <option key={cat.id} value={cat.id}>
                                  {getLocalizedName(cat)}
                                </option>
                              )
                            ))}
                          </select>
                        </div>

                        {/* Level 2: Product (shown after category selected) */}
                        <div>
                          <label className={labelClass}>
                            {t('selectProduct')}
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            disabled={!item.categoryId}
                            className={`${inputClass} ${!item.categoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <option value="">
                              {item.categoryId
                                ? (filteredProducts.length > 0
                                    ? t('selectProductPlaceholder')
                                    : t('noProductsInCategory'))
                                : t('selectCategoryFirst')}
                            </option>
                            {filteredProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {getLocalizedName(p)} ({p.sku})
                              </option>
                            ))}
                          </select>
                          {item.categoryId && filteredProducts.length > 0 && (
                            <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3" />
                              {filteredProducts.length} {t('productsAvailable')}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Free-text product name (always available as fallback) */}
                    <div className={categories.length > 0 ? 'sm:col-span-2' : 'sm:col-span-2'}>
                      <label className={labelClass}>
                        {categories.length > 0 ? t('orTypeProductName') : t('productName')}
                      </label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) =>
                          handleItemChange(index, 'productName', e.target.value)
                        }
                        placeholder={t('productName')}
                        className={inputClass}
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className={labelClass}>{t('quantity')}</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                        className={inputClass}
                      />
                    </div>

                    {/* Unit */}
                    <div>
                      <label className={labelClass}>{t('unit')}</label>
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          handleItemChange(index, 'unit', e.target.value)
                        }
                        className={inputClass}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Specs / Notes */}
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Specifications / Notes</label>
                      <textarea
                        rows={2}
                        value={item.specs}
                        onChange={(e) =>
                          handleItemChange(index, 'specs', e.target.value)
                        }
                        placeholder="Size, material, standard, or other requirements..."
                        className={inputClass + ' resize-none'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {errors.items && (
              <p className="text-red-500 text-xs">{errors.items}</p>
            )}

            <button
              type="button"
              onClick={addItem}
              className="btn-outline text-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('addProduct')}
            </button>
          </div>
        </div>

        {/* ── Technical Requirements ── */}
        <div>
          <label htmlFor="techRequirements" className={labelClass}>
            {t('technicalRequirements')}
          </label>
          <textarea
            id="techRequirements"
            rows={4}
            value={techRequirements}
            onChange={(e) => setTechRequirements(e.target.value)}
            placeholder={t('technicalRequirements')}
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* ── Additional Message ── */}
        <div>
          <label htmlFor="additionalMessage" className={labelClass}>
            {t('message')}
          </label>
          <textarea
            id="additionalMessage"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('message')}
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* ── File Upload ── */}
        <div>
          <label className={labelClass}>{t('uploadFile')}</label>
          {attachmentUrl ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
              <FileCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800 flex-1 truncate">{attachmentName}</span>
              <button
                type="button"
                onClick={() => { setAttachmentUrl(''); setAttachmentName(''); }}
                className="p-1 text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary-200 rounded-xl p-8 text-center bg-primary-50 hover:border-secondary-400 transition-colors cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-10 h-10 text-secondary-400 mx-auto mb-3 animate-spin" />
              ) : (
                <Upload className="w-10 h-10 text-primary-300 mx-auto mb-3" />
              )}
              <p className="text-primary-500 text-sm">{uploading ? 'Uploading...' : t('uploadHint')}</p>
              <p className="text-primary-400 text-xs mt-1">PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.dwg,.step"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 10 * 1024 * 1024) {
                toast.error('File too large (max 10MB)');
                return;
              }
              setUploading(true);
              try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                setAttachmentUrl(data.url);
                setAttachmentName(file.name);
                toast.success('File uploaded successfully');
              } catch {
                toast.error('File upload failed');
              } finally {
                setUploading(false);
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto gap-2 text-lg px-10 py-4 disabled:opacity-60 disabled:cursor-not-allowed relative"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{locale === 'zh' ? '提交中...' : 'Submitting...'}</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              {t('title')}
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
