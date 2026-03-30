type GtagEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function isGaConfigured(): boolean {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  if (!gaId) return false;
  const placeholders = ['YOUR_', 'CHANGE_', 'PLACEHOLDER', 'XXX', ''];
  return !placeholders.some((p) => gaId.toUpperCase().includes(p));
}

export function trackEvent(
  eventName: string,
  params?: GtagEventParams
): void {
  if (typeof window === 'undefined' || !isGaConfigured()) return;
  window.gtag?.('event', eventName, params);
}

// ─── Common E-commerce / B2B Events ────────────────────────

export function trackPageView(url: string): void {
  trackEvent('page_view', { page_path: url });
}

export function trackProductView(product: {
  id: string;
  name: string;
  category?: string;
  price?: number;
}): void {
  trackEvent('view_item', {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category,
    price: product.price,
    currency: 'USD',
  });
}

export function trackInquirySubmit(inquiry: {
  productCount: number;
  source?: string;
}): void {
  trackEvent('inquiry_submit', {
    item_count: inquiry.productCount,
    source: inquiry.source,
  });
}

export function trackAddToInquiry(product: {
  id: string;
  name: string;
  price?: number;
}): void {
  trackEvent('add_to_cart', {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    currency: 'USD',
  });
}

export function trackQuoteRequest(quote: {
  itemCount: number;
  totalValue?: number;
}): void {
  trackEvent('begin_checkout', {
    item_count: quote.itemCount,
    value: quote.totalValue,
    currency: 'USD',
  });
}

export function trackOrderComplete(order: {
  orderId: string;
  value: number;
  itemCount: number;
}): void {
  trackEvent('purchase', {
    transaction_id: order.orderId,
    value: order.value,
    currency: 'USD',
    item_count: order.itemCount,
  });
}

export function trackContactSubmit(source?: string): void {
  trackEvent('generate_lead', { source: source ?? 'contact_form' });
}

export function trackSearch(query: string): void {
  trackEvent('search', { search_term: query });
}
