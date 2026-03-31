'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import zhMessages from '@/messages/zh.json';

type Messages = typeof zhMessages;

interface AdminLocaleContextValue {
  /** Always 'zh' inside admin pages */
  locale: 'zh';
  /** Full Chinese message bundle */
  messages: Messages;
  /** Shorthand: get a top-level section, e.g. t('admin') → zhMessages.admin */
  t: <K extends keyof Messages>(section: K) => Messages[K];
}

const AdminLocaleContext = createContext<AdminLocaleContextValue | null>(null);

/**
 * Wraps admin pages so every child can call `useAdminLocale()` and always
 * receive Chinese translations, regardless of the URL locale.
 */
export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AdminLocaleContextValue>(
    () => ({
      locale: 'zh',
      messages: zhMessages,
      t: (section) => zhMessages[section],
    }),
    [],
  );

  return (
    <AdminLocaleContext.Provider value={value}>
      {children}
    </AdminLocaleContext.Provider>
  );
}

/**
 * Returns Chinese translations for admin pages.
 * Must be used inside `<AdminLocaleProvider>`.
 */
export function useAdminLocale(): AdminLocaleContextValue {
  const ctx = useContext(AdminLocaleContext);
  if (!ctx) {
    throw new Error('useAdminLocale must be used within <AdminLocaleProvider>');
  }
  return ctx;
}
