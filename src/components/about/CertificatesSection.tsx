'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Award, Download } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  image: string | null;
  pdfUrl: string | null;
  validUntil: string | null;
  createdAt: string;
}

interface CertificatesSectionProps {
  certificates: Certificate[];
}

export default function CertificatesSection({ certificates }: CertificatesSectionProps) {
  const t = useTranslations('about');
  const certT = useTranslations('certificates');

  return (
    <section className="section-padding bg-primary-50">
      <div className="container-wide">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-sm font-semibold uppercase tracking-wider text-secondary-600 mb-3">
            {t('qualifications')}
          </span>
          <h2 className="heading-2 mb-4">{t('qualifications')}</h2>
          <p className="text-lg text-primary-500 max-w-2xl mx-auto">
            {t('qualDesc')}
          </p>
        </motion.div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                variants={fadeUp}
                className="card p-6 flex flex-col items-center text-center"
              >
                {/* Image Placeholder */}
                <div className="w-full aspect-[3/4] rounded-lg bg-gradient-to-br from-accent-50 to-accent-100 border border-accent-200 flex items-center justify-center mb-4">
                  <Award className="w-16 h-16 text-accent-400" />
                </div>

                <h4 className="font-bold text-primary-800 mb-1">{cert.name}</h4>
                <p className="text-sm text-primary-500 mb-4">{cert.issuer}</p>

                {cert.pdfUrl && (
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline text-sm px-4 py-2 gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {certT('downloadCert')}
                  </a>
                )}
                {!cert.pdfUrl && (
                  <button
                    disabled
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary-200 text-primary-400 text-sm font-semibold cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {certT('downloadCert')}
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Award className="w-16 h-16 text-primary-300 mx-auto mb-4" />
            <p className="text-primary-500">
              ISO 9001 · ISO 14001 · CE · DNV-GL · CCS
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
