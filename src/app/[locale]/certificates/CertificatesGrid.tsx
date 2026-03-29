'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Download, X, Shield, CalendarDays, Building2 } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  description: Record<string, string>;
  image: string | null;
  pdfUrl: string | null;
  validUntil: string | null;
  createdAt: string;
}

interface Props {
  certificates: Certificate[];
  locale: string;
}

export default function CertificatesGrid({ certificates, locale }: Props) {
  const certT = useTranslations('certificates');
  const tc = useTranslations('common');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const validLabel: Record<string, string> = {
    en: 'Valid Until',
    zh: '有效期至',
    ja: '有効期限',
    ar: 'صالح حتى',
  };

  const issuedByLabel: Record<string, string> = {
    en: 'Issued by',
    zh: '颁发机构',
    ja: '発行元',
    ar: 'صادر من',
  };

  return (
    <>
      {/* Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {certificates.map((cert) => (
          <motion.div
            key={cert.id}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
            }}
            className="card p-6 flex flex-col items-center text-center group cursor-pointer hover:shadow-xl transition-shadow duration-300"
            onClick={() => setSelectedCert(cert)}
          >
            {/* Certificate Image / Icon */}
            <div className="w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200 flex items-center justify-center mb-4 relative overflow-hidden">
              {cert.image ? (
                <img
                  src={cert.image}
                  alt={cert.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Award className="w-16 h-16 text-accent-400 group-hover:scale-110 transition-transform duration-300" />
                  <Shield className="w-8 h-8 text-accent-300" />
                </div>
              )}
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-primary-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {tc('learnMore')}
                </span>
              </div>
            </div>

            <h4 className="font-bold text-primary-800 mb-1 group-hover:text-secondary-600 transition-colors">
              {cert.name}
            </h4>
            <p className="text-sm text-primary-500 mb-2">{cert.issuer}</p>

            {cert.validUntil && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3 w-3" />
                {validLabel[locale] || validLabel.en}:{' '}
                {new Date(cert.validUntil).toLocaleDateString(
                  locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'ar' ? 'ar-SA' : 'en-US',
                  { year: 'numeric', month: 'short' }
                )}
              </div>
            )}

            {cert.pdfUrl && (
              <a
                href={cert.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="btn-outline text-sm px-4 py-2 gap-2 mt-4"
              >
                <Download className="w-4 h-4" />
                {certT('downloadCert')}
              </a>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative">
                <div className="h-48 bg-gradient-to-br from-accent-100 to-primary-100 flex items-center justify-center rounded-t-2xl">
                  {selectedCert.image ? (
                    <img
                      src={selectedCert.image}
                      alt={selectedCert.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <Award className="w-24 h-24 text-accent-400" />
                  )}
                </div>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-primary-800 mb-2">
                  {selectedCert.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">
                    {issuedByLabel[locale] || issuedByLabel.en}:
                  </span>{' '}
                  {selectedCert.issuer}
                </div>

                {selectedCert.validUntil && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                    <CalendarDays className="h-4 w-4" />
                    <span className="font-medium">
                      {validLabel[locale] || validLabel.en}:
                    </span>{' '}
                    {new Date(selectedCert.validUntil).toLocaleDateString(
                      locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'ar' ? 'ar-SA' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </div>
                )}

                <p className="text-slate-700 leading-relaxed mb-6">
                  {selectedCert.description[locale] || selectedCert.description.en}
                </p>

                <div className="flex gap-3">
                  {selectedCert.pdfUrl && (
                    <a
                      href={selectedCert.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {certT('downloadCert')}
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedCert(null)}
                    className="btn-outline text-sm"
                  >
                    {tc('close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
