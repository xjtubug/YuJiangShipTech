const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  AED: 'د.إ',
};

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  CNY: 7.24,
  JPY: 149.5,
  AED: 3.67,
};

export function formatPrice(price: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const decimals = currency === 'JPY' ? 0 : 2;
  const formatted = price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatted}`;
}

export function convertCurrency(priceUsd: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency];
  if (!rate) return priceUsd;
  return Math.round(priceUsd * rate * 100) / 100;
}

export function generateInquiryNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INQ-${y}${m}${d}-${rand}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + '...';
}

export function getCountryFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return '🏳️';
  const offset = 0x1f1e6;
  const a = code.charCodeAt(0) - 65 + offset;
  const b = code.charCodeAt(1) - 65 + offset;
  return String.fromCodePoint(a, b);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
