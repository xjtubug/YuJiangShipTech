'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompareArrows, Trash2, Package } from 'lucide-react';
import { useCompareStore } from '@/lib/store';
import { formatPrice, cn } from '@/lib/utils';

interface CompareDrawerProps {
  locale: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLocalizedField(obj: any, field: string, locale: string): string {
  const key = `${field}${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
  return obj[key] || obj[`${field}En`] || '';
}

export default function CompareDrawer({ locale }: CompareDrawerProps) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const currentLocale = useLocale();
  const effectiveLocale = locale || currentLocale;
  const [modalOpen, setModalOpen] = useState(false);

  const { products, productData, removeProduct, clear } = useCompareStore();

  if (products.length === 0) return null;

  const comparedItems = products
    .map((id) => productData[id])
    .filter(Boolean);

  // Collect all spec keys across products for comparison
  const allSpecKeys = new Set<string>();
  comparedItems.forEach((item) => {
    try {
      const specs = JSON.parse(item.specsJson || '{}');
      Object.keys(specs).forEach((k) => allSpecKeys.add(k));
    } catch {
      // ignore
    }
  });

  return (
    <>
      {/* Fixed bottom bar */}
      <AnimatePresence>
        {products.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-primary-200 shadow-2xl"
          >
            <div className="container-wide py-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
                  <GitCompareArrows className="w-5 h-5 text-secondary-600" />
                  {t('compareProducts')} ({products.length}/4)
                </div>

                {/* Product thumbnails */}
                <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
                  {comparedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 flex-shrink-0"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-secondary-100 rounded flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary-300" />
                      </div>
                      <span className="text-xs font-medium text-primary-700 max-w-[120px] truncate">
                        {getLocalizedField(item, 'name', effectiveLocale)}
                      </span>
                      <button
                        onClick={() => removeProduct(item.id)}
                        className="text-primary-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={clear}
                    className="text-sm text-primary-500 hover:text-red-500 transition-colors px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModalOpen(true)}
                    disabled={products.length < 2}
                    className={cn(
                      'btn-primary text-sm px-4 py-2',
                      products.length < 2 && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {t('compareNow')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-primary-800">
                  {t('comparisonTable')}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-primary-500" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-auto max-h-[calc(85vh-4rem)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="sticky left-0 bg-white px-4 py-3 text-left text-primary-500 font-medium w-36" />
                      {comparedItems.map((item) => (
                        <th
                          key={item.id}
                          className="px-4 py-3 text-center min-w-[180px]"
                        >
                          <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-primary-300" />
                          </div>
                          <p className="font-semibold text-primary-800 line-clamp-2">
                            {getLocalizedField(item, 'name', effectiveLocale)}
                          </p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* SKU */}
                    <tr className="bg-slate-50">
                      <td className="sticky left-0 bg-slate-50 px-4 py-2.5 font-medium text-primary-700">
                        {t('sku')}
                      </td>
                      {comparedItems.map((item) => (
                        <td key={item.id} className="px-4 py-2.5 text-center text-primary-600">
                          {item.sku}
                        </td>
                      ))}
                    </tr>
                    {/* Price */}
                    <tr>
                      <td className="sticky left-0 bg-white px-4 py-2.5 font-medium text-primary-700">
                        {t('price')}
                      </td>
                      {comparedItems.map((item) => (
                        <td key={item.id} className="px-4 py-2.5 text-center font-semibold text-accent-600">
                          {formatPrice(item.priceUsd, 'USD')}
                        </td>
                      ))}
                    </tr>
                    {/* Category */}
                    <tr className="bg-slate-50">
                      <td className="sticky left-0 bg-slate-50 px-4 py-2.5 font-medium text-primary-700">
                        {t('category')}
                      </td>
                      {comparedItems.map((item) => (
                        <td key={item.id} className="px-4 py-2.5 text-center text-primary-600">
                          {item.categoryName}
                        </td>
                      ))}
                    </tr>
                    {/* MOQ */}
                    <tr>
                      <td className="sticky left-0 bg-white px-4 py-2.5 font-medium text-primary-700">
                        {tc('moq')}
                      </td>
                      {comparedItems.map((item) => (
                        <td key={item.id} className="px-4 py-2.5 text-center text-primary-600">
                          {item.moq} {tc('pcs')}
                        </td>
                      ))}
                    </tr>
                    {/* Lead Time */}
                    <tr className="bg-slate-50">
                      <td className="sticky left-0 bg-slate-50 px-4 py-2.5 font-medium text-primary-700">
                        {tc('leadTime')}
                      </td>
                      {comparedItems.map((item) => (
                        <td key={item.id} className="px-4 py-2.5 text-center text-primary-600">
                          {item.leadTimeDays} {tc('days')}
                        </td>
                      ))}
                    </tr>
                    {/* Specs */}
                    {Array.from(allSpecKeys).map((specKey, idx) => (
                      <tr key={specKey} className={idx % 2 === 0 ? '' : 'bg-slate-50'}>
                        <td
                          className={cn(
                            'sticky left-0 px-4 py-2.5 font-medium text-primary-700',
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                          )}
                        >
                          {specKey}
                        </td>
                        {comparedItems.map((item) => {
                          let val = '—';
                          try {
                            const specs = JSON.parse(item.specsJson || '{}');
                            val = specs[specKey] || '—';
                          } catch {
                            // ignore
                          }
                          return (
                            <td key={item.id} className="px-4 py-2.5 text-center text-primary-600">
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
