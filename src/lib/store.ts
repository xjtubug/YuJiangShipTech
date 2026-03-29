import { create } from 'zustand';

/* ─── Inquiry Cart ─── */

interface InquiryItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  specs?: string;
}

interface InquiryStore {
  items: InquiryItem[];
  addItem: (item: InquiryItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

export const useInquiryStore = create<InquiryStore>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const exists = state.items.find((i) => i.productId === item.productId);
      if (exists) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      ),
    })),
  clear: () => set({ items: [] }),
}));

/* ─── Currency ─── */

interface CurrencyStore {
  currency: string;
  setCurrency: (currency: string) => void;
}

export const useCurrencyStore = create<CurrencyStore>((set) => ({
  currency: 'USD',
  setCurrency: (currency) => set({ currency }),
}));

/* ─── Cookie Consent ─── */

type ConsentStatus = null | 'accepted' | 'declined';

interface CookieConsentStore {
  consent: ConsentStatus;
  setConsent: (consent: ConsentStatus) => void;
}

export const useCookieConsentStore = create<CookieConsentStore>((set) => ({
  consent: null,
  setConsent: (consent) => set({ consent }),
}));

/* ─── Product Compare ─── */

const MAX_COMPARE = 4;

export interface CompareProductData {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  priceUsd: number;
  moq: number;
  leadTimeDays: number;
  categoryName: string;
  specsJson: string;
  sku: string;
}

interface CompareStore {
  products: string[];
  productData: Record<string, CompareProductData>;
  addProduct: (productId: string) => void;
  removeProduct: (productId: string) => void;
  setProductData: (id: string, data: CompareProductData) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
  products: [],
  productData: {},
  addProduct: (productId) =>
    set((state) => {
      if (state.products.includes(productId)) return state;
      if (state.products.length >= MAX_COMPARE) return state;
      return { products: [...state.products, productId] };
    }),
  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((id) => id !== productId),
      productData: Object.fromEntries(
        Object.entries(state.productData).filter(([id]) => id !== productId)
      ),
    })),
  setProductData: (id, data) =>
    set((state) => ({
      productData: { ...state.productData, [id]: data },
    })),
  clear: () => set({ products: [], productData: {} }),
}));

/* ─── Search ─── */

interface SearchStore {
  query: string;
  setQuery: (query: string) => void;
  isOpen: boolean;
  toggle: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
