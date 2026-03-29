const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  CNY: '¥',
  JPY: '¥',
  AED: 'د.إ',
};

const EXCHANGE_RATES_FROM_CNY: Record<string, number> = {
  CNY: 1,
  USD: 0.138,
  EUR: 0.127,
  JPY: 20.65,
  AED: 0.507,
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

export function convertCurrency(priceCny: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES_FROM_CNY[targetCurrency];
  if (!rate) return priceCny;
  return Math.round(priceCny * rate * 100) / 100;
}

export function convertFromUsd(priceUsd: number, targetCurrency: string): number {
  const usdToCny = 7.24;
  const cny = priceUsd * usdToCny;
  return convertCurrency(cny, targetCurrency);
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
