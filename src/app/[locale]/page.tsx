import { getTranslations } from "next-intl/server";
import dynamic from "next/dynamic";
import prisma from "@/lib/prisma";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";

const AdvantagesSection = dynamic(
	() => import("@/components/home/AdvantagesSection"),
	{
		loading: () => (
			<div className="section-padding bg-white">
				<div className="container-wide h-64 animate-pulse bg-slate-100 rounded-2xl" />
			</div>
		),
	},
);
const CertificationsSection = dynamic(
	() => import("@/components/home/CertificationsSection"),
	{
		loading: () => (
			<div className="section-padding bg-slate-50">
				<div className="container-wide h-48 animate-pulse bg-slate-100 rounded-2xl" />
			</div>
		),
	},
);
const NewsSection = dynamic(() => import("@/components/home/NewsSection"), {
	loading: () => (
		<div className="section-padding bg-white">
			<div className="container-wide h-64 animate-pulse bg-slate-100 rounded-2xl" />
		</div>
	),
});
export const revalidate = 300;

export default async function HomePage() {
	const t = await getTranslations("common");

	const [products, news, certificates, popularProducts] = await Promise.all([
		prisma.product.findMany({
			where: { featured: true, published: true },
			select: {
				id: true,
				slug: true,
				nameEn: true,
				nameZh: true,
				nameJa: true,
				nameAr: true,
				sku: true,
				descEn: true,
				priceUsd: true,
				moq: true,
				featured: true,
				images: true,
				createdAt: true,
				updatedAt: true,
				category: true,
			},
			orderBy: { createdAt: "desc" },
			take: 8,
		}),
		prisma.news.findMany({
			where: { published: true },
			orderBy: { createdAt: "desc" },
			take: 3,
		}),
		prisma.certificate.findMany({
			orderBy: { createdAt: "desc" },
		}),
		// Get popular products for search tags (based on page views)
		prisma.product.findMany({
			where: { published: true },
			select: {
				slug: true,
				nameEn: true,
				nameZh: true,
				category: true,
				_count: { select: { pageViews: true } },
			},
			orderBy: { pageViews: { _count: "desc" } },
			take: 6,
		}),
	]);

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

	const serializedNews = news.map((n) => ({
		...n,
		createdAt: n.createdAt.toISOString(),
	}));

	const serializedCertificates = certificates.map((c) => ({
		...c,
		validUntil: c.validUntil?.toISOString() ?? null,
		createdAt: c.createdAt.toISOString(),
	}));

	const searchTags = popularProducts.map((p) => ({
		nameEn: p.nameEn,
		nameZh: p.nameZh,
		slug: p.slug,
	}));

	// JSON-LD structured data for featured products
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: t("companyName"),
		description: t("tagline"),
		numberOfItems: serializedProducts.length,
		itemListElement: serializedProducts.map((p, i) => ({
			"@type": "ListItem",
			position: i + 1,
			item: {
				"@type": "Product",
				name: p.nameEn,
				sku: p.sku,
				description: p.descEn,
				image: undefined,
				offers: {
					"@type": "Offer",
					priceCurrency: "USD",
					price: p.priceUsd,
					availability: "https://schema.org/InStock",
				},
			},
		})),
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<HeroSection searchTags={searchTags} />
			<FeaturedProducts products={serializedProducts} />
			<AdvantagesSection />
			<CertificationsSection certificates={serializedCertificates} />
			<NewsSection news={serializedNews} />
		</>
	);
}
