'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import GoogleMap, { DEFAULT_LAT, DEFAULT_LNG } from '@/components/common/GoogleMap';

interface LocationSettings {
  company_lat?: string;
  company_lng?: string;
  company_address?: string;
  google_maps_api_key?: string;
}

export default function LocationMapSection() {
  const t = useTranslations('about');
  const [location, setLocation] = useState<LocationSettings>({});

  useEffect(() => {
    fetch('/api/settings/public?keys=company_lat,company_lng,company_address,google_maps_api_key')
      .then((res) => res.json())
      .then((data) => setLocation(data))
      .catch(() => {});
  }, []);

  const lat = location.company_lat ? parseFloat(location.company_lat) : DEFAULT_LAT;
  const lng = location.company_lng ? parseFloat(location.company_lng) : DEFAULT_LNG;
  const apiKey = location.google_maps_api_key || undefined;
  const address = location.company_address || '';

  return (
    <section className="section-padding bg-white">
      <div className="container-wide">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-sm font-semibold uppercase tracking-wider text-secondary-600 mb-3">
            {t('location')}
          </span>
          <h2 className="heading-2 mb-4">{t('location')}</h2>
          <p className="text-lg text-primary-500 max-w-2xl mx-auto">
            {t('locationDesc')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {address && (
            <div className="flex items-center justify-center gap-2 mb-6 text-primary-600">
              <MapPin className="w-5 h-5 text-secondary-600 flex-shrink-0" />
              <span className="text-base font-medium">{address}</span>
            </div>
          )}
          <GoogleMap
            lat={lat}
            lng={lng}
            apiKey={apiKey}
            className="h-[400px]"
            zoom={13}
          />
        </motion.div>
      </div>
    </section>
  );
}
