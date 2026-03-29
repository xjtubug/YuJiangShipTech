'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

function getVisitorId(): string {
  const key = 'yj_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmKeys = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ];
  const utm: Record<string, string> = {};
  for (const key of utmKeys) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return utm;
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const sentRef = useRef(false);

  const sendTimeOnPage = useCallback(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (duration < 1) return;

    const body = JSON.stringify({
      type: 'time_on_page',
      visitorId: getVisitorId(),
      path: pathname,
      duration,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', body);
    } else {
      fetch('/api/track', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    sentRef.current = false;

    const visitorId = getVisitorId();
    const utm = getUtmParams();

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'pageview',
        visitorId,
        path: pathname,
        title: document.title,
        referrer: document.referrer,
        ...utm,
      }),
    }).catch(() => {});

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendTimeOnPage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sendTimeOnPage();
    };
  }, [pathname, sendTimeOnPage]);

  return null;
}
