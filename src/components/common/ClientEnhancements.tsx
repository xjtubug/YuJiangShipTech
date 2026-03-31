'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import WhatsAppFloat from '@/components/common/WhatsAppFloat';
import SocialFloat from '@/components/common/SocialFloat';
import CookieConsent from '@/components/common/CookieConsent';
import TrackingScripts from '@/components/common/TrackingScripts';
import VisitorTracker from '@/components/common/VisitorTracker';

export default function ClientEnhancements() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <WhatsAppFloat />
      <SocialFloat />
      <CookieConsent />
      <TrackingScripts />
      <VisitorTracker />
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
    </>
  );
}
