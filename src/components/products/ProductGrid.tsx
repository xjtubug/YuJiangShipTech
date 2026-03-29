import ProductCard from './ProductCard';

interface ProductData {
  id: string;
  slug: string;
  sku: string;
  nameEn: string;
  nameZh: string;
  nameJa: string;
  nameAr: string;
  descEn: string;
  descZh: string;
  descJa: string;
  descAr: string;
  priceUsd: number;
  moq: number;
  leadTimeDays: number;
  specsJson: string;
  featured: boolean;
  images: string;
  category: {
    slug: string;
    nameEn: string;
    nameZh: string;
    nameJa: string;
    nameAr: string;
  };
}

interface ProductGridProps {
  products: ProductData[];
  locale: string;
}

export default function ProductGrid({ products, locale }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
