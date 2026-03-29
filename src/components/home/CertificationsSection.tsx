'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, Download } from 'lucide-react';

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  image: string | null;
  pdfUrl: string | null;
}

export default function CertificationsSection({
  certificates,
}: {
  certificates: Certificate[];
}) {
  const t = useTranslations('certificates');

  if (!certificates.length) return null;

  // Double the items for seamless marquee loop
  const items = [...certificates, ...certificates];

  return (
    <section className="section-padding bg-slate-50 overflow-hidden">
      <div className="container-wide mb-10">
        <div className="text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-secondary-600 font-semibold text-sm uppercase tracking-wider"
          >
            {t('subtitle')}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="heading-2 mt-2"
          >
            {t('title')}
          </motion.h2>
        </div>
      </div>

      {/* Marquee wrapper */}
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 to-transparent z-10" />

        <div className="flex animate-marquee gap-6 w-max">
          {items.map((cert, i) => (
            <div
              key={`${cert.id}-${i}`}
              className="flex-shrink-0 w-56 bg-white rounded-xl border border-slate-100 p-6 flex flex-col items-center text-center hover:shadow-lg hover:border-secondary-200 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-primary-600" />
              </div>
              <h4 className="font-bold text-primary-800 text-sm mb-1">
                {cert.name}
              </h4>
              <p className="text-xs text-slate-500">{cert.issuer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Download link */}
      <div className="container-wide mt-10 text-center">
        <Link
          href="/certificates"
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-600 hover:text-secondary-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          {t('downloadCert')}
        </Link>
      </div>
    </section>
  );
}
