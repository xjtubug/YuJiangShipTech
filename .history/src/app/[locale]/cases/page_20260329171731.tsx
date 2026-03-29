import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';
import CasesGrid from './CasesGrid';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('cases');
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

const fallbackCases = [
  {
    id: '1',
    slug: 'cosco-bulk-carrier-fleet',
    titleEn: 'COSCO Shipping Bulk Carrier Fleet Valve Supply',
    titleZh: '中远海运散货船队阀门供应项目',
    clientName: 'COSCO Shipping',
    clientLogo: null,
    country: 'China',
    image: null,
    contentEn:
      'Supplied over 2,000 marine butterfly valves and gate valves for COSCO Shipping\'s new-build bulk carrier fleet. The project covered 12 vessels ranging from 82,000 DWT to 210,000 DWT Capesize carriers. All valves were delivered with DNV-GL type approval and passed rigorous factory acceptance testing (FAT) before shipment. The partnership resulted in a 3-year framework agreement for ongoing fleet maintenance supply.',
    contentZh:
      '为中远海运新建散货船队供应了超过2000台船用蝶阀和闸阀。该项目涵盖12艘船舶，从82,000载重吨到210,000载重吨的好望角型散货船。所有阀门均获得DNV-GL型式认证，并在发货前通过了严格的工厂验收测试（FAT）。此次合作促成了一份为期3年的框架协议，用于持续的船队维护供应。',
    rating: 5,
    createdAt: '2024-10-15T00:00:00.000Z',
  },
  {
    id: '2',
    slug: 'daewoo-lng-carrier-project',
    titleEn: 'Daewoo Shipbuilding LNG Carrier Equipment Package',
    titleZh: '大宇造船LNG运输船设备配套项目',
    clientName: 'Daewoo Shipbuilding & Marine Engineering',
    clientLogo: null,
    country: 'South Korea',
    image: null,
    contentEn:
      'Provided a complete marine valve package for two 174,000 m³ LNG carriers built at DSME\'s Okpo shipyard. The scope included cryogenic butterfly valves rated for -162°C, high-pressure gas supply valves, and ballast system gate valves. All products met Korean Register (KR) and Lloyd\'s Register (LR) requirements. Our engineering team worked closely with DSME\'s design department to ensure seamless integration.',
    contentZh:
      '为大宇造船巨济岛船厂建造的两艘174,000立方米LNG运输船提供了完整的船用阀门配套方案。范围包括适用于-162°C的低温蝶阀、高压气体供应阀和压载系统闸阀。所有产品均满足韩国船级社（KR）和劳氏船级社（LR）要求。我们的工程团队与大宇造船的设计部门紧密合作，确保无缝集成。',
    rating: 5,
    createdAt: '2024-08-20T00:00:00.000Z',
  },
  {
    id: '3',
    slug: 'mediterranean-cruise-retrofit',
    titleEn: 'Mediterranean Cruise Line Vessel Retrofit Program',
    titleZh: '地中海邮轮船队改装项目',
    clientName: 'Mediterranean Shipping Company',
    clientLogo: null,
    country: 'Italy',
    image: null,
    contentEn:
      'Executed a comprehensive valve retrofit program for 5 cruise vessels as part of their environmental compliance upgrade. Replaced 800+ aging gate valves and globe valves with modern, low-friction alternatives to improve energy efficiency. The project was completed across 5 dry-docking periods over 18 months, with zero schedule delays. Energy savings of 8% were achieved on seawater cooling systems.',
    contentZh:
      '作为环保合规升级的一部分，为5艘邮轮执行了全面的阀门改装项目。将800多台老化的闸阀和截止阀更换为现代低摩擦替代品，以提高能源效率。该项目在18个月内通过5次干坞期完成，零延误。海水冷却系统实现了8%的能源节约。',
    rating: 5,
    createdAt: '2024-06-10T00:00:00.000Z',
  },
  {
    id: '4',
    slug: 'singapore-offshore-platform',
    titleEn: 'Singapore Offshore Platform Equipment Supply',
    titleZh: '新加坡海上平台设备供应项目',
    clientName: 'Keppel Offshore & Marine',
    clientLogo: null,
    country: 'Singapore',
    image: null,
    contentEn:
      'Supplied high-pressure gate valves and check valves for a semi-submersible drilling platform. All equipment met API 6D and API 6DSS standards with NACE MR0175 compliance for sour service applications. The valves were designed for operating pressures up to 10,000 PSI and temperatures ranging from -29°C to 121°C. Complete material traceability and extensive documentation packages were provided.',
    contentZh:
      '为一座半潜式钻井平台供应了高压闸阀和止回阀。所有设备均符合API 6D和API 6DSS标准，并通过NACE MR0175酸性环境认证。阀门设计工作压力高达10,000 PSI，温度范围从-29°C到121°C。提供了完整的材料可追溯性和详尽的文件包。',
    rating: 4,
    createdAt: '2024-04-05T00:00:00.000Z',
  },
  {
    id: '5',
    slug: 'japan-container-ship-series',
    titleEn: 'Japanese Container Ship Series Valve Package',
    titleZh: '日本集装箱船系列阀门配套',
    clientName: 'Imabari Shipbuilding',
    clientLogo: null,
    country: 'Japan',
    image: null,
    contentEn:
      'Delivered complete valve packages for a series of 8 × 14,000 TEU container ships built at Imabari Shipbuilding. The scope covered seawater butterfly valves, fuel oil gate valves, and ballast system check valves. All products carried NK (Nippon Kaiji Kyokai) class approval. Just-in-time delivery was coordinated across 8 hull construction schedules over a 24-month period.',
    contentZh:
      '为今治造船建造的8艘14,000 TEU集装箱船系列提供了完整的阀门配套方案。范围涵盖海水蝶阀、燃油闸阀和压载系统止回阀。所有产品均获得NK（日本海事协会）船级认证。在24个月内协调了8艘船体建造进度的准时交付。',
    rating: 5,
    createdAt: '2024-02-18T00:00:00.000Z',
  },
  {
    id: '6',
    slug: 'norwegian-offshore-vessel',
    titleEn: 'Norwegian Offshore Support Vessel Fleet',
    titleZh: '挪威海上支援船船队项目',
    clientName: 'Ulstein Group',
    clientLogo: null,
    country: 'Norway',
    image: null,
    contentEn:
      'Provided marine deck equipment and valve solutions for a fleet of 4 Platform Supply Vessels (PSVs) built at Ulstein Verft. The project included fire-safe butterfly valves, quick-closing valves for fuel tank systems, and hydraulic deck valve assemblies. All products were certified by DNV and delivered with full 3.1 material certificates per EN 10204.',
    contentZh:
      '为Ulstein船厂建造的4艘平台供应船（PSV）提供了船用甲板设备和阀门解决方案。项目包括防火蝶阀、燃油舱系统速关阀和液压甲板阀组件。所有产品均通过DNV认证，并按EN 10204标准提供完整的3.1材料证书。',
    rating: 5,
    createdAt: '2023-11-30T00:00:00.000Z',
  },
];

export default async function CasesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('cases');
  const navT = await getTranslations('nav');

  // Try DB first
  let cases: typeof fallbackCases;
  try {
    const dbCases = await prisma.caseStudy.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (dbCases.length > 0) {
      cases = dbCases.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      }));
    } else {
      cases = fallbackCases;
    }
  } catch {
    cases = fallbackCases;
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb items={[{ label: navT('cases') }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-4">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Cases Grid */}
      <section className="section-padding bg-slate-50">
        <div className="container-wide">
          <CasesGrid cases={cases} locale={locale} />
        </div>
      </section>
    </>
  );
}
