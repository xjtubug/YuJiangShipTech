import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';
import NewsGrid from './NewsGrid';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('news');
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

const fallbackNews = [
  {
    id: '1',
    slug: 'imo-2024-emission-regulations',
    titleEn: 'IMO 2024: New Emission Regulations Impact on Marine Equipment',
    titleZh: 'IMO 2024：新排放法规对船舶设备的影响',
    titleJa: 'IMO 2024：新排出規制が船舶設備に与える影響',
    titleAr: 'المنظمة البحرية الدولية 2024: تأثير لوائح الانبعاثات الجديدة على المعدات البحرية',
    contentEn:
      'The International Maritime Organization has introduced stricter emission standards for 2024. These regulations will require significant upgrades to marine valve systems and exhaust treatment equipment. Ship owners and operators must ensure compliance by retrofitting existing vessels or investing in new-build solutions that meet EEXI and CII requirements.',
    contentZh:
      '国际海事组织已出台2024年更严格的排放标准。这些法规将要求对船用阀门系统和废气处理设备进行重大升级。船东和运营商必须通过改造现有船舶或投资符合EEXI和CII要求的新建解决方案来确保合规。',
    excerpt: 'New IMO regulations require significant upgrades to marine equipment. Learn how this affects the industry.',
    image: null,
    source: 'IMO Press',
    category: 'Regulation',
    published: true,
    createdAt: '2024-12-15T08:00:00.000Z',
  },
  {
    id: '2',
    slug: 'yujiang-expands-production-capacity',
    titleEn: 'YuJiang ShipTech Expands Production Capacity by 40%',
    titleZh: '禺疆船艇科技产能扩张40%',
    titleJa: '禺疆シップテック、生産能力を40％拡大',
    titleAr: 'يوجيانغ شيب تك توسع طاقتها الإنتاجية بنسبة 40٪',
    contentEn:
      'YuJiang ShipTechnology has completed the expansion of its manufacturing facility in Ningbo, adding 20,000 square meters of production space. The new facility features state-of-the-art CNC machining centers, automated assembly lines, and advanced quality testing laboratories. This investment enables faster delivery times and higher production volumes to meet growing global demand.',
    contentZh:
      '禺疆船艇科技已完成位于宁波的生产基地扩建，新增2万平方米生产空间。新厂房配备了先进的数控加工中心、自动化装配线和质量检测实验室。这项投资使公司能够缩短交货时间、提高产量，以满足日益增长的全球需求。',
    excerpt: 'Our new 20,000㎡ facility expansion brings faster delivery and higher production capacity.',
    image: null,
    source: 'Company News',
    category: 'Company',
    published: true,
    createdAt: '2024-11-28T10:00:00.000Z',
  },
  {
    id: '3',
    slug: 'smart-shipping-iot-trends-2025',
    titleEn: 'Smart Shipping: IoT and Digital Twins Reshape Maritime Industry',
    titleZh: '智慧航运：物联网和数字孪生重塑海运行业',
    titleJa: 'スマートシッピング：IoTとデジタルツインが海運業界を変革',
    titleAr: 'الشحن الذكي: إنترنت الأشياء والتوائم الرقمية تعيد تشكيل الصناعة البحرية',
    contentEn:
      'The maritime industry is undergoing a digital transformation with IoT sensors, AI-powered predictive maintenance, and digital twin technology. These innovations allow real-time monitoring of marine equipment performance, reducing downtime and maintenance costs by up to 30%. Leading shipyards are already integrating smart systems into new vessel designs.',
    contentZh:
      '海运行业正在经历数字化转型，物联网传感器、AI驱动的预测性维护和数字孪生技术正在发挥重要作用。这些创新技术可以实现船舶设备性能的实时监控，将停机时间和维护成本降低高达30%。领先的船厂已经开始在新船设计中集成智能系统。',
    excerpt: 'IoT sensors and digital twins are reducing maritime maintenance costs by up to 30%.',
    image: null,
    source: 'Maritime Executive',
    category: 'Technology',
    published: true,
    createdAt: '2024-11-10T09:00:00.000Z',
  },
  {
    id: '4',
    slug: 'dnv-certification-achievement',
    titleEn: 'YuJiang Achieves DNV-GL Type Approval for New Valve Series',
    titleZh: '禺疆获得DNV-GL新型阀门系列型式认证',
    titleJa: '禺疆が新バルブシリーズでDNV-GL型式承認を取得',
    titleAr: 'يوجيانغ تحصل على موافقة DNV-GL على سلسلة الصمامات الجديدة',
    contentEn:
      'YuJiang ShipTechnology has received DNV-GL type approval for its latest marine butterfly valve and gate valve series. This certification confirms that our products meet the highest international standards for safety, reliability, and performance in marine applications. The approved range covers DN50 to DN600 in various pressure ratings.',
    contentZh:
      '禺疆船艇科技最新的船用蝶阀和闸阀系列已获得DNV-GL型式认证。该认证证明我们的产品在船舶应用中达到了最高的国际安全、可靠性和性能标准。获批产品涵盖DN50至DN600多种压力等级。',
    excerpt: 'Our latest marine valve series has earned DNV-GL type approval for DN50-DN600 range.',
    image: null,
    source: 'Company News',
    category: 'Certification',
    published: true,
    createdAt: '2024-10-22T07:30:00.000Z',
  },
  {
    id: '5',
    slug: 'green-shipbuilding-trends',
    titleEn: 'Green Shipbuilding: LNG and Hydrogen Fuel Systems Drive Innovation',
    titleZh: '绿色造船：LNG和氢燃料系统推动创新',
    titleJa: 'グリーン造船：LNGと水素燃料システムがイノベーションを推進',
    titleAr: 'بناء السفن الخضراء: أنظمة وقود الغاز الطبيعي المسال والهيدروجين تدفع الابتكار',
    contentEn:
      'The shift toward green shipping is accelerating with LNG-powered vessels and hydrogen fuel cell technology. New marine equipment must be designed to handle alternative fuels safely. This trend creates opportunities for manufacturers who can provide certified, high-performance components for next-generation clean energy propulsion systems.',
    contentZh:
      '随着LNG动力船舶和氢燃料电池技术的发展，向绿色航运的转型正在加速。新型船舶设备必须能够安全处理替代燃料。这一趋势为能够提供认证高性能组件的制造商创造了机遇。',
    excerpt: 'LNG and hydrogen fuel systems are creating new demands for marine equipment manufacturers.',
    image: null,
    source: 'Ship Technology',
    category: 'Industry',
    published: true,
    createdAt: '2024-10-05T11:00:00.000Z',
  },
  {
    id: '6',
    slug: 'china-shipbuilding-output-record',
    titleEn: 'China Shipbuilding Output Reaches Record High in 2024',
    titleZh: '2024年中国造船产量创历史新高',
    titleJa: '2024年、中国の造船生産量が過去最高を記録',
    titleAr: 'إنتاج بناء السفن في الصين يصل إلى مستوى قياسي في 2024',
    contentEn:
      'China\'s shipbuilding industry has achieved record output in 2024, with completions exceeding 45 million DWT. Chinese shipyards now account for over 50% of global new-build orders. This growth drives demand for high-quality marine components and equipment from domestic manufacturers like YuJiang ShipTechnology.',
    contentZh:
      '中国造船业在2024年实现了创纪录的产量，完工量超过4500万载重吨。中国船厂目前占全球新建订单的50%以上。这一增长推动了对禺疆船艇科技等国内制造商高质量船用零部件和设备的需求。',
    excerpt: 'Chinese shipyards account for over 50% of global new-build orders, driving equipment demand.',
    image: null,
    source: 'CANSI Report',
    category: 'Industry',
    published: true,
    createdAt: '2024-09-18T06:00:00.000Z',
  },
];

const categoryLabels: Record<string, Record<string, string>> = {
  Regulation: { en: 'Regulation', zh: '法规', ja: '規制', ar: 'التنظيمات' },
  Company: { en: 'Company', zh: '公司动态', ja: '企業情報', ar: 'أخبار الشركة' },
  Technology: { en: 'Technology', zh: '技术', ja: 'テクノロジー', ar: 'التكنولوجيا' },
  Certification: { en: 'Certification', zh: '认证', ja: '認証', ar: 'الشهادات' },
  Industry: { en: 'Industry', zh: '行业', ja: '業界', ar: 'الصناعة' },
};

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('news');
  const navT = await getTranslations('nav');

  // Try DB first, fall back to hardcoded data
  let newsItems: typeof fallbackNews;
  try {
    const dbNews = await prisma.news.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
    if (dbNews.length > 0) {
      newsItems = dbNews.map((n) => ({
        ...n,
        category: n.source || 'Company',
        published: true,
        createdAt: n.createdAt.toISOString(),
      }));
    } else {
      newsItems = fallbackNews;
    }
  } catch {
    newsItems = fallbackNews;
  }

  const categories = [...new Set(newsItems.map((n) => n.category))];

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb items={[{ label: navT('news') }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-4">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* News Grid */}
      <section className="section-padding bg-slate-50">
        <div className="container-wide">
          <NewsGrid
            news={newsItems}
            locale={locale}
            categories={categories}
            categoryLabels={categoryLabels}
          />
        </div>
      </section>
    </>
  );
}
