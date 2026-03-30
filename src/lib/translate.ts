/**
 * Auto-translation library for YuJiangShipTech B2B platform.
 * Primary: Google Translate free endpoint (no key needed).
 * Fallback: LibreTranslate API (if TRANSLATE_API_KEY is set).
 */

// In-memory cache: "from:to:text" → translated string
const cache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text}`;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Translate a single text string using Google Translate free API,
 * falling back to LibreTranslate if configured.
 */
export async function translateText(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  if (!text.trim()) return text;
  if (from === to) return text;

  const ck = cacheKey(text, from, to);
  const cached = cache.get(ck);
  if (cached) return cached;

  // Primary: Google Translate free endpoint
  try {
    const result = await googleTranslate(text, from, to);
    if (result && result !== text) {
      cache.set(ck, result);
      return result;
    }
  } catch {
    // Fall through to LibreTranslate
  }

  // Fallback: LibreTranslate (if API key is set)
  const apiKey = process.env.TRANSLATE_API_KEY;
  const apiUrl = process.env.TRANSLATE_API_URL;
  if (apiKey && apiUrl) {
    try {
      const result = await libreTranslate(text, from, to, apiUrl, apiKey);
      if (result && result !== text) {
        cache.set(ck, result);
        return result;
      }
    } catch {
      // Return original text on failure
    }
  }

  return text;
}

async function googleTranslate(
  text: string,
  from: string,
  to: string,
): Promise<string> {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', from);
  url.searchParams.set('tl', to);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Google Translate HTTP ${res.status}`);
  }

  // Response format: [[["translated text","source text",...],...],...]
  const data = await res.json();
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error('Unexpected Google Translate response format');
  }

  const translated = data[0]
    .filter((seg: unknown) => Array.isArray(seg) && seg.length >= 1)
    .map((seg: unknown[]) => seg[0])
    .join('');

  return translated || text;
}

async function libreTranslate(
  text: string,
  from: string,
  to: string,
  apiUrl: string,
  apiKey: string,
): Promise<string> {
  const res = await fetch(`${apiUrl}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: from, target: to, api_key: apiKey }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`LibreTranslate HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.translatedText || text;
}

/**
 * Batch translate multiple key-value pairs from one language to another.
 * Adds a 200ms delay between requests to respect rate limits.
 */
export async function translateBatch(
  texts: Record<string, string>,
  from: string,
  to: string,
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const entries = Object.entries(texts);

  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    result[key] = await translateText(value, from, to);
    // Rate limiting: small delay between requests (skip after last)
    if (i < entries.length - 1) {
      await delay(200);
    }
  }

  return result;
}

/**
 * Bulk translate texts to multiple target languages.
 * Input keys ending with source lang suffix get re-keyed with target lang suffix.
 * E.g. { nameZh: "船用发动机" } → { en: { nameEn: "Marine Engine" }, ja: { nameJa: "船舶エンジン" } }
 */
export async function translateBulk(
  texts: Record<string, string>,
  from: string,
  targets: string[],
): Promise<Record<string, Record<string, string>>> {
  const langSuffixMap: Record<string, string> = {
    zh: 'Zh',
    en: 'En',
    ja: 'Ja',
    ar: 'Ar',
  };

  const fromSuffix = langSuffixMap[from] || from;
  const result: Record<string, Record<string, string>> = {};

  for (const target of targets) {
    const toSuffix = langSuffixMap[target] || target;
    const translated = await translateBatch(texts, from, target);

    // Re-key: replace source lang suffix with target lang suffix
    const rekeyed: Record<string, string> = {};
    for (const [key, value] of Object.entries(translated)) {
      const newKey = key.endsWith(fromSuffix)
        ? key.slice(0, -fromSuffix.length) + toSuffix
        : key;
      rekeyed[newKey] = value;
    }
    result[target] = rekeyed;
  }

  return result;
}
