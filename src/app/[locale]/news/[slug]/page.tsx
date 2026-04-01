import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';
import NewsArticleContent from './NewsArticleContent';

const fallbackArticles: Record<string, {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  titleJa: string;
  titleAr: string;
  contentEn: string;
  contentZh: string;
  contentJa: string;
  contentAr: string;
  excerpt: string | null;
  image: string | null;
  images: string;
  source: string | null;
  sourceUrl: string | null;
  category: string;
  author: string;
  publishedAt: string;
  createdAt: string;
}> = {
  'imo-2024-emission-regulations': {
    id: '1',
    slug: 'imo-2024-emission-regulations',
    titleEn: 'IMO 2024: New Emission Regulations Impact on Marine Equipment',
    titleZh: 'IMO 2024：新排放法规对船舶设备的影响',
    titleJa: 'IMO 2024：新排出規制が船舶設備に与える影響',
    titleAr: 'المنظمة البحرية الدولية 2024: تأثير لوائح الانبعاثات الجديدة على المعدات البحرية',
    contentEn: `<p>The International Maritime Organization has introduced stricter emission standards for 2024. These regulations will require significant upgrades to marine valve systems and exhaust treatment equipment.</p>

<h2>Key Changes in IMO 2024 Regulations</h2>

<p>The updated MARPOL Annex VI introduces tighter limits on sulfur oxide (SOx) and nitrogen oxide (NOx) emissions from ships. Key highlights include:</p>

<ul>
<li><strong>EEXI Compliance</strong> – All existing ships must meet Energy Efficiency Existing Ship Index requirements</li>
<li><strong>CII Rating</strong> – Carbon Intensity Indicator ratings will determine operational efficiency grades from A to E</li>
<li><strong>Fuel Quality Standards</strong> – Stricter sulfur content limits in marine fuels globally</li>
<li><strong>Emission Control Areas</strong> – Expanded ECAs with near-zero emission requirements</li>
</ul>

<h2>Impact on Marine Equipment</h2>

<p>Ship owners and operators must ensure compliance by retrofitting existing vessels or investing in new-build solutions. Marine valve manufacturers play a critical role by providing:</p>

<ul>
<li>High-performance butterfly valves for exhaust gas cleaning systems (scrubbers)</li>
<li>Specialized gate valves for ballast water treatment systems</li>
<li>Corrosion-resistant check valves for LNG fuel supply lines</li>
<li>Smart actuated valves with IoT monitoring capabilities</li>
</ul>

<h2>YuJiang's Response</h2>

<p>YuJiang ShipTechnology is actively developing next-generation marine valves that meet these stricter standards. Our R&D team has introduced a new line of low-friction butterfly valves specifically designed for scrubber applications, achieving 15% better flow efficiency compared to conventional designs.</p>

<p>Contact our technical team to discuss how our products can help your fleet achieve IMO 2024 compliance.</p>`,
    contentZh: `<p>国际海事组织已出台2024年更严格的排放标准。这些法规将要求对船用阀门系统和废气处理设备进行重大升级。</p>

<h2>IMO 2024法规主要变化</h2>

<p>更新后的MARPOL附则VI对船舶的硫氧化物（SOx）和氮氧化物（NOx）排放设定了更严格的限制。主要内容包括：</p>

<ul>
<li><strong>EEXI合规</strong> – 所有现有船舶必须满足现有船舶能效指数要求</li>
<li><strong>CII评级</strong> – 碳强度指标评级将确定A至E的运营效率等级</li>
<li><strong>燃料质量标准</strong> – 全球范围内更严格的船用燃料硫含量限制</li>
<li><strong>排放控制区</strong> – 扩大的排放控制区域，要求接近零排放</li>
</ul>

<h2>对船舶设备的影响</h2>

<p>船东和运营商必须通过改造现有船舶或投资新建解决方案来确保合规。船用阀门制造商通过提供以下产品发挥关键作用：</p>

<ul>
<li>适用于废气清洗系统（洗涤器）的高性能蝶阀</li>
<li>适用于压载水处理系统的专用闸阀</li>
<li>适用于LNG燃料供应管路的耐腐蚀止回阀</li>
<li>具有物联网监控功能的智能执行器阀门</li>
</ul>

<h2>禺疆的应对</h2>

<p>禺疆船艇科技正在积极开发满足更严格标准的新一代船用阀门。我们的研发团队推出了专为洗涤器应用设计的新型低摩擦蝶阀系列，与传统设计相比，流量效率提高了15%。</p>

<p>请联系我们的技术团队，讨论我们的产品如何帮助您的船队实现IMO 2024合规。</p>`,
    contentJa: '',
    contentAr: '',
    excerpt: 'New IMO regulations require significant upgrades to marine equipment. Learn how this affects the industry.',
    image: null,
    images: '[]',
    source: 'IMO Press',
    sourceUrl: null,
    category: 'industry',
    author: 'YuJiang Technical Team',
    publishedAt: '2024-12-15T08:00:00.000Z',
    createdAt: '2024-12-15T08:00:00.000Z',
  },
  'yujiang-expands-production-capacity': {
    id: '2',
    slug: 'yujiang-expands-production-capacity',
    titleEn: 'YuJiang ShipTech Expands Production Capacity by 40%',
    titleZh: '禺疆船艇科技产能扩张40%',
    titleJa: '禺疆シップテック、生産能力を40％拡大',
    titleAr: 'يوجيانغ شيب تك توسع طاقتها الإنتاجية بنسبة 40٪',
    contentEn: `<p>YuJiang ShipTechnology has completed the expansion of its manufacturing facility in Ningbo, adding 20,000 square meters of production space.</p>

<h2>New Facility Highlights</h2>

<p>The expanded facility represents a significant investment in our production capabilities:</p>

<ul>
<li><strong>Advanced CNC Centers</strong> – 12 new 5-axis CNC machining centers for precision valve manufacturing</li>
<li><strong>Automated Assembly</strong> – Robotic assembly lines reducing production time by 35%</li>
<li><strong>Quality Lab</strong> – ISO 17025 accredited testing laboratory with hydrostatic and pneumatic test benches</li>
<li><strong>Clean Room</strong> – Dedicated clean room facility for high-precision instrument valve assembly</li>
</ul>

<h2>Enhanced Delivery Capabilities</h2>

<p>This expansion enables us to:</p>

<ul>
<li>Reduce standard lead times from 30 days to 15-20 days</li>
<li>Handle larger orders of up to 5,000 units per month</li>
<li>Offer express manufacturing for urgent maritime projects</li>
<li>Maintain larger inventory of standard sizes for immediate dispatch</li>
</ul>

<p>Our customers can expect faster turnaround times and improved flexibility in order fulfillment, ensuring their vessel construction and maintenance schedules stay on track.</p>`,
    contentZh: `<p>禺疆船艇科技已完成位于宁波的生产基地扩建，新增2万平方米生产空间。</p>

<h2>新设施亮点</h2>

<p>扩建后的设施代表了我们在生产能力方面的重大投资：</p>

<ul>
<li><strong>先进的数控中心</strong> – 12台新型五轴数控加工中心，用于精密阀门制造</li>
<li><strong>自动化装配</strong> – 机器人装配线使生产时间缩短35%</li>
<li><strong>质量实验室</strong> – ISO 17025认证的测试实验室，配备静水和气动测试台</li>
<li><strong>洁净室</strong> – 专用洁净室设施，用于高精度仪表阀组装</li>
</ul>

<h2>增强的交付能力</h2>

<p>此次扩建使我们能够：</p>

<ul>
<li>将标准交货期从30天缩短至15-20天</li>
<li>处理每月多达5,000台的大批量订单</li>
<li>为紧急海事项目提供快速制造服务</li>
<li>维持更大的标准规格库存以便即时发货</li>
</ul>

<p>我们的客户可以期待更快的周转时间和更灵活的订单履行能力，确保其船舶建造和维护计划按时推进。</p>`,
    contentJa: '',
    contentAr: '',
    excerpt: 'Our new 20,000㎡ facility expansion brings faster delivery and higher production capacity.',
    image: null,
    images: '[]',
    source: 'Company News',
    sourceUrl: null,
    category: 'company',
    author: 'YuJiang PR Department',
    publishedAt: '2024-11-28T10:00:00.000Z',
    createdAt: '2024-11-28T10:00:00.000Z',
  },
  'smart-shipping-iot-trends-2025': {
    id: '3',
    slug: 'smart-shipping-iot-trends-2025',
    titleEn: 'Smart Shipping: IoT and Digital Twins Reshape Maritime Industry',
    titleZh: '智慧航运：物联网和数字孪生重塑海运行业',
    titleJa: 'スマートシッピング：IoTとデジタルツインが海運業界を変革',
    titleAr: 'الشحن الذكي: إنترنت الأشياء والتوائم الرقمية تعيد تشكيل الصناعة البحرية',
    contentEn: `<p>The maritime industry is undergoing a digital transformation with IoT sensors, AI-powered predictive maintenance, and digital twin technology.</p>

<h2>The Digital Maritime Revolution</h2>

<p>These innovations allow real-time monitoring of marine equipment performance, reducing downtime and maintenance costs by up to 30%. Leading shipyards are already integrating smart systems into new vessel designs.</p>

<h2>Key Technologies Driving Change</h2>

<ul>
<li><strong>IoT Sensors</strong> – Wireless vibration, temperature, and pressure sensors mounted on valves, pumps, and other critical equipment</li>
<li><strong>Digital Twins</strong> – Virtual replicas of physical assets that simulate real-time behavior and predict failures before they occur</li>
<li><strong>AI Analytics</strong> – Machine learning algorithms that analyze equipment data to optimize maintenance schedules</li>
<li><strong>Cloud Platforms</strong> – Centralized dashboards for fleet-wide equipment health monitoring</li>
</ul>

<h2>Smart Marine Equipment</h2>

<p>Next-generation marine valves and pumps are being designed with built-in sensor interfaces and digital communication protocols. This enables:</p>

<ul>
<li>Real-time valve position and torque monitoring</li>
<li>Automated leak detection and alert systems</li>
<li>Predictive seal and gasket replacement scheduling</li>
<li>Remote diagnostics and firmware updates</li>
</ul>

<p>YuJiang ShipTechnology is investing in smart valve technology, with plans to launch IoT-ready products by Q3 2025.</p>`,
    contentZh: `<p>海运行业正在经历数字化转型，物联网传感器、AI驱动的预测性维护和数字孪生技术正在发挥重要作用。</p>

<h2>数字海事革命</h2>

<p>这些创新技术可以实现船舶设备性能的实时监控，将停机时间和维护成本降低高达30%。领先的船厂已经开始在新船设计中集成智能系统。</p>

<h2>推动变革的关键技术</h2>

<ul>
<li><strong>物联网传感器</strong> – 安装在阀门、泵和其他关键设备上的无线振动、温度和压力传感器</li>
<li><strong>数字孪生</strong> – 物理资产的虚拟副本，模拟实时行为并在故障发生前进行预测</li>
<li><strong>AI分析</strong> – 分析设备数据以优化维护计划的机器学习算法</li>
<li><strong>云平台</strong> – 用于全船队设备健康监控的集中式仪表板</li>
</ul>

<h2>智能船舶设备</h2>

<p>新一代船用阀门和泵正在设计内置传感器接口和数字通信协议。这使得以下功能成为可能：</p>

<ul>
<li>实时阀门位置和扭矩监控</li>
<li>自动泄漏检测和警报系统</li>
<li>预测性密封件和垫片更换调度</li>
<li>远程诊断和固件更新</li>
</ul>

<p>禺疆船艇科技正在投资智能阀门技术，计划在2025年第三季度推出支持物联网的产品。</p>`,
    contentJa: '',
    contentAr: '',
    excerpt: 'IoT sensors and digital twins are reducing maritime maintenance costs by up to 30%.',
    image: null,
    images: '[]',
    source: 'Maritime Executive',
    sourceUrl: null,
    category: 'industry',
    author: 'Maritime Technology Review',
    publishedAt: '2024-11-10T09:00:00.000Z',
    createdAt: '2024-11-10T09:00:00.000Z',
  },
  'dnv-certification-achievement': {
    id: '4',
    slug: 'dnv-certification-achievement',
    titleEn: 'YuJiang Achieves DNV-GL Type Approval for New Valve Series',
    titleZh: '禺疆获得DNV-GL新型阀门系列型式认证',
    titleJa: '禺疆が新バルブシリーズでDNV-GL型式承認を取得',
    titleAr: 'يوجيانغ تحصل على موافقة DNV-GL على سلسلة الصمامات الجديدة',
    contentEn: `<p>YuJiang ShipTechnology has received DNV-GL type approval for its latest marine butterfly valve and gate valve series.</p>

<h2>Certification Scope</h2>

<p>This certification confirms that our products meet the highest international standards for safety, reliability, and performance in marine applications. The approved range covers:</p>

<ul>
<li>Marine Butterfly Valves: DN50 to DN600, PN10/PN16</li>
<li>Marine Gate Valves: DN50 to DN400, PN16/PN25</li>
<li>Materials: Cast steel, stainless steel, and bronze variants</li>
<li>Applications: Seawater, freshwater, fuel oil, and ballast systems</li>
</ul>

<h2>Rigorous Testing Process</h2>

<p>The type approval process involved extensive testing at DNV's accredited laboratories including hydrostatic shell tests, seat leakage tests, endurance cycling tests, and fire-safe performance validation.</p>

<p>We are proud that our products passed all tests on the first submission, demonstrating our commitment to manufacturing excellence and quality assurance.</p>`,
    contentZh: `<p>禺疆船艇科技最新的船用蝶阀和闸阀系列已获得DNV-GL型式认证。</p>

<h2>认证范围</h2>

<p>该认证证明我们的产品在船舶应用中达到了最高的国际安全、可靠性和性能标准。获批范围包括：</p>

<ul>
<li>船用蝶阀：DN50至DN600，PN10/PN16</li>
<li>船用闸阀：DN50至DN400，PN16/PN25</li>
<li>材料：铸钢、不锈钢和青铜变体</li>
<li>应用：海水、淡水、燃油和压载系统</li>
</ul>

<h2>严格的测试过程</h2>

<p>型式认证过程涉及在DNV认证实验室进行的广泛测试，包括静水壳体试验、阀座泄漏试验、耐久性循环试验和防火性能验证。</p>

<p>我们自豪地宣布，我们的产品在首次提交时就通过了所有测试，这充分体现了我们对制造卓越和质量保证的承诺。</p>`,
    contentJa: '',
    contentAr: '',
    excerpt: 'Our latest marine valve series has earned DNV-GL type approval for DN50-DN600 range.',
    image: null,
    images: '[]',
    source: 'Company News',
    sourceUrl: null,
    category: 'company',
    author: 'YuJiang Quality Department',
    publishedAt: '2024-10-22T07:30:00.000Z',
    createdAt: '2024-10-22T07:30:00.000Z',
  },
  'green-shipbuilding-trends': {
    id: '5',
    slug: 'green-shipbuilding-trends',
    titleEn: 'Green Shipbuilding: LNG and Hydrogen Fuel Systems Drive Innovation',
    titleZh: '绿色造船：LNG和氢燃料系统推动创新',
    titleJa: 'グリーン造船：LNGと水素燃料システムがイノベーションを推進',
    titleAr: 'بناء السفن الخضراء: أنظمة وقود الغاز الطبيعي المسال والهيدروجين تدفع الابتكار',
    contentEn: `<p>The shift toward green shipping is accelerating with LNG-powered vessels and hydrogen fuel cell technology.</p>

<h2>Alternative Fuel Adoption</h2>

<p>New marine equipment must be designed to handle alternative fuels safely. This trend creates opportunities for manufacturers who can provide certified, high-performance components for next-generation clean energy propulsion systems.</p>

<h2>Equipment Requirements</h2>

<ul>
<li><strong>Cryogenic Valves</strong> – Specialized valves rated for -162°C LNG service</li>
<li><strong>High-Pressure Fittings</strong> – Components for 350-700 bar hydrogen storage systems</li>
<li><strong>Safety Relief Valves</strong> – Dual-redundancy systems for fuel gas supply lines</li>
<li><strong>Material Innovation</strong> – Super duplex stainless steels and nickel alloys for extreme conditions</li>
</ul>

<p>The green shipping transition represents a once-in-a-generation opportunity for marine equipment manufacturers to innovate and lead the market transformation.</p>`,
    contentZh: `<p>随着LNG动力船舶和氢燃料电池技术的发展，向绿色航运的转型正在加速。</p>

<h2>替代燃料的采用</h2>

<p>新型船舶设备必须能够安全处理替代燃料。这一趋势为能够提供经过认证的高性能组件的制造商创造了机遇。</p>

<h2>设备要求</h2>

<ul>
<li><strong>低温阀门</strong> – 适用于-162°C LNG工况的专用阀门</li>
<li><strong>高压接头</strong> – 适用于350-700 bar氢气储存系统的组件</li>
<li><strong>安全泄压阀</strong> – 燃气供应管路的双重冗余系统</li>
<li><strong>材料创新</strong> – 适用于极端条件的超级双相不锈钢和镍合金</li>
</ul>

<p>绿色航运转型为船舶设备制造商提供了千载难逢的创新机遇。</p>`,
    contentJa: '',
    contentAr: '',
    excerpt: 'LNG and hydrogen fuel systems are creating new demands for marine equipment manufacturers.',
    image: null,
    images: '[]',
    source: 'Ship Technology',
    sourceUrl: null,
    category: 'industry',
    author: 'Ship Technology Report',
    publishedAt: '2024-10-05T11:00:00.000Z',
    createdAt: '2024-10-05T11:00:00.000Z',
  },
  'china-shipbuilding-output-record': {
    id: '6',
    slug: 'china-shipbuilding-output-record',
    titleEn: 'China Shipbuilding Output Reaches Record High in 2024',
    titleZh: '2024年中国造船产量创历史新高',
    titleJa: '2024年、中国の造船生産量が過去最高を記録',
    titleAr: 'إنتاج بناء السفن في الصين يصل إلى مستوى قياسي في 2024',
    contentEn: `<p>China's shipbuilding industry has achieved record output in 2024, with completions exceeding 45 million DWT.</p>

<h2>Market Overview</h2>

<p>Chinese shipyards now account for over 50% of global new-build orders. This growth drives demand for high-quality marine components and equipment from domestic manufacturers.</p>

<h2>Key Statistics</h2>

<ul>
<li>Total completions: 45.2 million DWT (+12% year-over-year)</li>
<li>New orders: 78.5 million DWT</li>
<li>Order backlog: 180+ million DWT</li>
<li>Global market share: 52.4%</li>
</ul>

<h2>Growth Drivers</h2>

<p>The surge is fueled by strong demand for LNG carriers, container ships, and bulk carriers. Environmental regulations are also driving fleet renewal as older vessels are retired in favor of more efficient new-builds.</p>

<p>As a leading Chinese marine equipment manufacturer, YuJiang ShipTechnology is well-positioned to support this growth with our comprehensive product range and expanded production capacity.</p>`,
    contentZh: `<p>中国造船业在2024年实现了创纪录的产量，完工量超过4500万载重吨。</p>

<h2>市场概况</h2>

<p>中国船厂目前占全球新建订单的50%以上。这一增长推动了对国内制造商高质量船用零部件和设备的需求。</p>

<h2>关键数据</h2>

<ul>
<li>总完工量：4520万载重吨（同比增长12%）</li>
<li>新接订单：7850万载重吨</li>
<li>手持订单：1.8亿载重吨以上</li>
<li>全球市场份额：52.4%</li>
</ul>

<h2>增长驱动力</h2>

<p>强劲增长源于对LNG运输船、集装箱船和散货船的强劲需求。环保法规也在推动船队更新，旧船退役以支持更高效的新建船舶。</p>

<p>作为中国领先的船舶设备制造商，禺疆船艇科技凭借全面的产品线和扩大的产能，能够有力支持这一增长趋势。</p>`,
    contentJa: '',
    contentAr: '',
    excerpt: 'Chinese shipyards account for over 50% of global new-build orders, driving equipment demand.',
    image: null,
    images: '[]',
    source: 'CANSI Report',
    sourceUrl: null,
    category: 'industry',
    author: 'Industry Analysis Team',
    publishedAt: '2024-09-18T06:00:00.000Z',
    createdAt: '2024-09-18T06:00:00.000Z',
  },
};

// Get all slugs for related articles
const allSlugs = Object.keys(fallbackArticles);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  try {
    const article = await prisma.news.findUnique({ where: { slug } });
    if (article) {
      const titleMap: Record<string, string> = { en: article.titleEn, zh: article.titleZh, ja: article.titleJa, ar: article.titleAr };
      const title = titleMap[locale] || article.titleEn;
      const description = article.excerpt || article.contentEn.substring(0, 160);
      return { title, description, openGraph: { title, description } };
    }
  } catch {
    // Fall through to bundled fallback content.
  }

  const fallbackArticle = fallbackArticles[slug];
  if (!fallbackArticle) {
    notFound();
  }

  const titleMap: Record<string, string> = {
    en: fallbackArticle.titleEn,
    zh: fallbackArticle.titleZh,
    ja: fallbackArticle.titleJa,
    ar: fallbackArticle.titleAr,
  };
  const title = titleMap[locale] || fallbackArticle.titleEn;
  const description = fallbackArticle.excerpt || '';

  return { title, description, openGraph: { title, description } };
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations('news');
  const navT = await getTranslations('nav');

  // Try DB first
  let article: (typeof fallbackArticles)[string] | null = null;
  try {
    const dbArticle = await prisma.news.findUnique({ where: { slug } });
    if (dbArticle) {
      article = {
        ...dbArticle,
        images: dbArticle.images || '[]',
        sourceUrl: dbArticle.sourceUrl || null,
        category: dbArticle.category || 'company',
        author: 'YuJiang Technical Team',
        publishedAt: dbArticle.publishedAt.toISOString(),
        createdAt: dbArticle.createdAt.toISOString(),
      };
    }
  } catch {
    // DB unavailable
  }

  if (!article) {
    article = fallbackArticles[slug] || null;
  }

  if (!article) {
    notFound();
  }

  // Get related articles (other slugs)
  const relatedSlugs = allSlugs.filter((s) => s !== slug).slice(0, 3);
  const relatedArticles = relatedSlugs
    .map((s) => fallbackArticles[s])
    .filter(Boolean);

  // Try to also get related from DB
  let dbRelated: typeof relatedArticles = [];
  try {
    const dbItems = await prisma.news.findMany({
      where: { published: true, slug: { not: slug } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    if (dbItems.length > 0) {
      dbRelated = dbItems.map((n) => ({
        ...n,
        images: n.images || '[]',
        sourceUrl: n.sourceUrl || null,
        category: n.category || 'company',
        author: '',
        publishedAt: n.publishedAt.toISOString(),
        createdAt: n.createdAt.toISOString(),
        contentJa: n.contentJa || '',
        contentAr: n.contentAr || '',
        titleJa: n.titleJa || '',
        titleAr: n.titleAr || '',
      }));
    }
  } catch {
    // ignore
  }

  const related = dbRelated.length > 0 ? dbRelated : relatedArticles;

  const titleMap: Record<string, string> = {
    en: article.titleEn,
    zh: article.titleZh,
    ja: article.titleJa,
    ar: article.titleAr,
  };
  const localizedTitle = titleMap[locale] || article.titleEn;

  // Pre-format dates on the server to avoid client/server hydration differences
  const publishedDate = new Date(article.publishedAt || article.createdAt).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'ar' ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Short date for related articles
  const relatedWithDates = related.map((r) => ({
    ...r,
    publishedDateShort: new Date(r.publishedAt || r.createdAt).toLocaleDateString(
      locale === 'zh' ? 'zh-CN' : locale === 'ja' ? 'ja-JP' : locale === 'ar' ? 'ar-SA' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    ),
  }));

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb
            items={[
              { label: navT('news'), href: '/news' },
              { label: localizedTitle },
            ]}
          />
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mt-4 max-w-4xl">
            {localizedTitle}
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Article Content */}
      <NewsArticleContent
        article={article}
        locale={locale}
        publishedDate={publishedDate}
        relatedArticles={relatedWithDates}
      />
    </>
  );
}
