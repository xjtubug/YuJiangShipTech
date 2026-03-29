export { routing } from '@/i18n/routing';

export const locales = ['en', 'zh', 'ja', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ar: 'العربية',
};

export async function getMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    return (await import(`@/messages/${defaultLocale}.json`)).default;
  }
}
