'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from '@/i18n/navigation';

export default function RouteProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    cleanup();

    // Start progress
    setVisible(true);
    setProgress(20);

    // Simulate trickle up to ~90%
    let current = 20;
    intervalRef.current = setInterval(() => {
      current += Math.random() * 15;
      if (current >= 90) {
        current = 90;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(current);
    }, 200);

    // Complete on next frame (route already changed when pathname updates)
    timerRef.current = setTimeout(() => {
      cleanup();
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 400);

    return cleanup;
  }, [pathname, cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
    >
      <div
        className="h-full bg-accent-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
