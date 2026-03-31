import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';
import ProductFilters from '@/components/products/ProductFilters';
import ProductGrid from '@/components/products/ProductGrid';
import CompareDrawer from '@/components/products/CompareDrawer';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
export const revalidate = 300;

const PRODUCTS_PER_PAGE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations('products');
  const tNav = await getTranslations('nav');

  const currentPage = Math.max(1, parseInt(sp.page || '1', 10));
  const categorySlug = sp.category;
  const searchQuery = sp.search;
  const sortBy = sp.sort || 'newest';
  const minPrice = sp.minPrice ? parseFloat(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? parseFloat(sp.maxPrice) : undefined;

  // Fetch categories with product counts
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { nameEn: 'asc' },
  });

  // Build where clause
  const where: Record<string, unknown> = { published: true };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (searchQuery) {
    where.OR = [
      { nameEn: { contains: searchQuery } },
      { nameZh: { contains: searchQuery } },
      { nameJa: { contains: searchQuery } },
      { descEn: { contains: searchQuery } },
      { sku: { contains: searchQuery } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceUsd = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  // Build orderBy
  let orderBy: Record<string, string>;
  switch (sortBy) {
    case 'price_asc':
      orderBy = { priceUsd: 'asc' };
      break;
    case 'price_desc':
      orderBy = { priceUsd: 'desc' };
      break;
    case 'popular':
      orderBy = { featured: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  // Fetch products with pagination
  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
      take: PRODUCTS_PER_PAGE,
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  // Serialize dates for client components
  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    category: {
      ...p.category,
      createdAt: p.category.createdAt.toISOString(),
    },
  }));

  const serializedCategories = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    productCount: c._count.products,
  }));

  // Breadcrumb
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: tNav('products'), href: '/products' },
  ];

  if (categorySlug) {
    const cat = categories.find((c) => c.slug === categorySlug);
    if (cat) {
      const nameKey = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}` as keyof typeof cat;
      breadcrumbItems.push({
        label: (cat[nameKey] as string) || cat.nameEn,
      });
    }
  }

  // Pagination URL builder
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('category', categorySlug);
    if (searchQuery) params.set('search', searchQuery);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (minPrice !== undefined) params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params.set('maxPrice', maxPrice.toString());
    if (page > 1) params.set('page', page.toString());
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ''}`;
  };

  // Pagination range (show max 7 page buttons)
  const getPaginationRange = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
    }
    return pages;
  };

  return (
    <>
      {/* Page header */}
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container-wide">
          <Breadcrumb items={breadcrumbItems} />
          <div className="pb-8">
            <h1 className="heading-2">{t('title')}</h1>
            <p className="text-primary-500 mt-2">{t('subtitle')}</p>
            {totalCount > 0 && (
              <p className="text-sm text-secondary-600 mt-1">
                {t('resultsCount', { count: totalCount })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container-wide py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <ProductFilters
              categories={serializedCategories}
              locale={locale}
              initialCategory={categorySlug}
              initialSearch={searchQuery}
              initialSort={sortBy}
              initialMinPrice={sp.minPrice}
              initialMaxPrice={sp.maxPrice}
            />
          </aside>

          {/* Product Grid & Pagination */}
          <div className="flex-1 min-w-0">
            {serializedProducts.length > 0 ? (
              <>
                <ProductGrid products={serializedProducts} locale={locale} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    className="flex items-center justify-center gap-2 mt-12"
                    aria-label="Pagination"
                  >
                    {currentPage > 1 && (
                      <Link
                        href={buildPageUrl(currentPage - 1)}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        {t('previous')}
                      </Link>
                    )}

                    {getPaginationRange().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="w-10 h-10 flex items-center justify-center text-primary-400"
                        >
                          …
                        </span>
                      ) : (
                        <Link
                          key={page}
                          href={buildPageUrl(page)}
                          className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                            page === currentPage
                              ? 'bg-primary-700 text-white'
                              : 'border border-primary-200 text-primary-700 hover:bg-primary-50'
                          }`}
                        >
                          {page}
                        </Link>
                      )
                    )}

                    {currentPage < totalPages && (
                      <Link
                        href={buildPageUrl(currentPage + 1)}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-primary-200 text-primary-700 hover:bg-primary-50 transition-colors"
                      >
                        {t('next')}
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <Package className="w-16 h-16 text-primary-200 mx-auto mb-4" />
                <p className="text-lg text-primary-400">{t('noProducts')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CompareDrawer locale={locale} />
    </>
  );
}
