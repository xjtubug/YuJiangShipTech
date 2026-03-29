'use client';

import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, Package } from 'lucide-react';
import { useInquiryStore } from '@/lib/store';

export default function InquiryCartSidebar() {
  const t = useTranslations('inquiry');
  const { items, removeItem, updateQuantity } = useInquiryStore();

  return (
    <div className="sticky top-24">
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-primary-100">
          <div className="w-10 h-10 rounded-lg bg-accent-500 text-white flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-primary-800">{t('inquiryCart')}</h3>
            {items.length > 0 && (
              <p className="text-xs text-primary-500">
                {t('cartItems', { count: items.length })}
              </p>
            )}
          </div>
        </div>

        {/* Items List */}
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <Package className="w-12 h-12 text-primary-200 mx-auto mb-3" />
              <p className="text-primary-400 text-sm">{t('cartEmpty')}</p>
            </motion.div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {items.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-3 rounded-lg bg-primary-50 border border-primary-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary-800 text-sm truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                Math.max(1, item.quantity - 1)
                              )
                            }
                            className="w-6 h-6 rounded bg-primary-200 text-primary-700 text-xs font-bold hover:bg-primary-300 transition-colors flex items-center justify-center"
                          >
                            −
                          </button>
                          <span className="text-sm text-primary-600 w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="w-6 h-6 rounded bg-primary-200 text-primary-700 text-xs font-bold hover:bg-primary-300 transition-colors flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs text-primary-400">
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={t('removeProduct')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {items.length > 0 && (
          <div className="mt-5 pt-4 border-t border-primary-100">
            <p className="text-xs text-primary-500 text-center">
              Fill the form and submit to get a quote for all items
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
