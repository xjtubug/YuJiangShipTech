'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Plus, Trash2, Upload, Send, Loader2, FileCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useInquiryStore } from '@/lib/store';

interface ProductOption {
  id: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  sku: string;
}

interface ProductItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  specs: string;
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

const UNITS = ['pcs', 'sets', 'meters', 'kg', 'tons'];

const COUNTRIES = [
  'China', 'Japan', 'South Korea', 'Singapore', 'India', 'Indonesia',
  'Vietnam', 'Thailand', 'Malaysia', 'Philippines', 'Turkey', 'Greece',
  'Norway', 'Germany', 'Netherlands', 'United Kingdom', 'United States',
  'Brazil', 'UAE', 'Saudi Arabia', 'Egypt', 'South Africa', 'Nigeria',
  'Russia', 'Australia', 'Other',
];

const nameFieldMap: Record<string, keyof ProductOption> = {
  en: 'nameEn',
  zh: 'nameZh',
  ja: 'nameJa',
  ar: 'nameAr',
};

export default function QuoteForm({ products }: { products: ProductOption[] }) {
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
    { productId: '', productName: '', quantity: 1, unit: 'pcs', specs: '' },
  ]);

  const [techRequirements, setTechRequirements] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // Pre-populate from inquiry store
  useEffect(() => {
    if (inquiryStore.items.length > 0) {
      const storeItems: ProductItem[] = inquiryStore.items.map((si) => ({
        productId: si.productId,
        productName: si.productName,
        quantity: si.quantity,
        unit: si.unit,
        specs: si.specs || '',
      }));
      setItems(storeItems);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getLocalizedName = (product: ProductOption): string => {
    const field = nameFieldMap[locale] || 'nameEn';
    return product[field] || product.nameEn;
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
      { productId: '', productName: '', quantity: 1, unit: 'pcs', specs: '' },
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
      };

      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      toast.success(
        `${t('submitSuccess')}${data.inquiryNumber ? `\nRef: ${data.inquiryNumber}` : ''}`,
        { duration: 8000 }
      );

      // Clear form and store
      setCompanyInfo({ companyName: '', contactName: '', email: '', phone: '', country: '' });
      setItems([{ productId: '', productName: '', quantity: 1, unit: 'pcs', specs: '' }]);
      setTechRequirements('');
      setMessage('');
      inquiryStore.clear();
    } catch {
      toast.error(t('submitError'));
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
            {items.map((item, index) => (
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
                  {/* Product Select / Free Text */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{t('productName')}</label>
                    {products.length > 0 ? (
                      <div className="flex gap-3">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            handleProductSelect(index, e.target.value)
                          }
                          className={inputClass + ' flex-1'}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {getLocalizedName(p)} ({p.sku})
                            </option>
                          ))}
                        </select>
                        <span className="self-center text-primary-400 text-sm">
                          or
                        </span>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) =>
                            handleItemChange(index, 'productName', e.target.value)
                          }
                          placeholder="Type product name"
                          className={inputClass + ' flex-1'}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) =>
                          handleItemChange(index, 'productName', e.target.value)
                        }
                        placeholder={t('productName')}
                        className={inputClass}
                      />
                    )}
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
            ))}

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

        {/* ── File Upload Placeholder ── */}
        <div>
          <label className={labelClass}>{t('uploadFile')}</label>
          <div className="border-2 border-dashed border-primary-200 rounded-xl p-8 text-center bg-primary-50 hover:border-secondary-400 transition-colors cursor-pointer">
            <Upload className="w-10 h-10 text-primary-300 mx-auto mb-3" />
            <p className="text-primary-500 text-sm">{t('uploadHint')}</p>
            <p className="text-primary-400 text-xs mt-1">
              PDF, DWG, STEP, JPG, PNG
            </p>
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full sm:w-auto gap-2 text-lg px-10 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {loading ? '...' : t('title')}
        </button>
      </form>
    </motion.div>
  );
}
