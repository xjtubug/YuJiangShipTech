import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import prisma from '@/lib/prisma';
import Breadcrumb from '@/components/layout/Breadcrumb';

const CertificatesGrid = dynamic(() => import('./CertificatesGrid'), {
  loading: () => <div className="animate-pulse bg-slate-100 rounded-2xl h-96" />,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('certificates');
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
    },
  };
}

interface CertItem {
  id: string;
  name: string;
  issuer: string;
  description: Record<string, string>;
  image: string | null;
  pdfUrl: string | null;
  validUntil: string | null;
  createdAt: string;
}

const fallbackCertificates: CertItem[] = [
  {
    id: '1',
    name: 'ISO 9001:2015',
    issuer: 'Bureau Veritas',
    description: {
      en: 'Quality Management System certification ensuring consistent quality in design, development, production, and delivery of marine equipment.',
      zh: '质量管理体系认证，确保船舶设备设计、开发、生产和交付的一贯质量。',
      ja: '船舶機器の設計・開発・製造・納品における一貫した品質を保証する品質マネジメントシステム認証。',
      ar: 'شهادة نظام إدارة الجودة التي تضمن الجودة المتسقة في تصميم وتطوير وإنتاج وتسليم المعدات البحرية.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2027-06-30T00:00:00.000Z',
    createdAt: '2024-07-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'ISO 14001:2015',
    issuer: 'Bureau Veritas',
    description: {
      en: 'Environmental Management System certification demonstrating our commitment to minimizing environmental impact in manufacturing operations.',
      zh: '环境管理体系认证，体现我们在制造运营中减少环境影响的承诺。',
      ja: '製造業務における環境負荷の最小化への取り組みを示す環境マネジメントシステム認証。',
      ar: 'شهادة نظام الإدارة البيئية التي تُظهر التزامنا بتقليل الأثر البيئي في عمليات التصنيع.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2027-06-30T00:00:00.000Z',
    createdAt: '2024-07-01T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'CE Marking',
    issuer: 'TÜV Rheinland',
    description: {
      en: 'European Conformity marking indicating compliance with EU health, safety, and environmental protection standards for marine equipment.',
      zh: '欧洲合格标志，表明船舶设备符合欧盟健康、安全和环境保护标准。',
      ja: '船舶機器がEUの健康・安全・環境保護基準に準拠していることを示す欧州適合マーク。',
      ar: 'علامة المطابقة الأوروبية التي تشير إلى الامتثال لمعايير الصحة والسلامة وحماية البيئة الأوروبية للمعدات البحرية.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2026-12-31T00:00:00.000Z',
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: '4',
    name: 'DNV-GL Type Approval',
    issuer: 'DNV GL',
    description: {
      en: 'Type approval certificate from DNV GL for marine butterfly valves, gate valves, and check valves covering DN50 to DN600 size range.',
      zh: 'DNV GL船用蝶阀、闸阀和止回阀型式认证，覆盖DN50至DN600尺寸范围。',
      ja: 'DN50からDN600サイズの船舶用バタフライバルブ、ゲートバルブ、チェックバルブに対するDNV GL型式承認証明書。',
      ar: 'شهادة موافقة النوع من DNV GL لصمامات الفراشة والصمامات البوابية وصمامات عدم الرجوع البحرية بأحجام من DN50 إلى DN600.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2028-03-15T00:00:00.000Z',
    createdAt: '2024-03-15T00:00:00.000Z',
  },
  {
    id: '5',
    name: 'CCS Type Approval',
    issuer: 'China Classification Society',
    description: {
      en: 'China Classification Society type approval for marine valves, pumps, and deck equipment used in Chinese-flagged and international vessels.',
      zh: '中国船级社船用阀门、泵和甲板设备型式认证，适用于中国籍和国际船舶。',
      ja: '中国船級協会による船舶用バルブ、ポンプ、甲板機器の型式承認。中国旗船および国際船舶に適用。',
      ar: 'موافقة النوع من جمعية التصنيف الصينية للصمامات والمضخات ومعدات السطح البحرية.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2027-09-01T00:00:00.000Z',
    createdAt: '2023-09-01T00:00:00.000Z',
  },
  {
    id: '6',
    name: 'Lloyd\'s Register Approval',
    issuer: 'Lloyd\'s Register',
    description: {
      en: 'Lloyd\'s Register type approval for marine gate valves and globe valves, certified for use in Class I and Class II piping systems.',
      zh: '劳氏船级社船用闸阀和截止阀型式认证，经认证可用于I类和II类管路系统。',
      ja: 'ロイドレジスターによる船舶用ゲートバルブおよびグローブバルブの型式承認。クラスIおよびクラスII配管系統での使用認証。',
      ar: 'موافقة النوع من سجل لويدز للصمامات البوابية والصمامات الكروية البحرية، معتمدة للاستخدام في أنظمة الأنابيب من الفئة الأولى والثانية.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2026-11-30T00:00:00.000Z',
    createdAt: '2023-12-01T00:00:00.000Z',
  },
  {
    id: '7',
    name: 'ABS Type Approval',
    issuer: 'American Bureau of Shipping',
    description: {
      en: 'ABS type approval for marine butterfly valves, ensuring compliance with ABS Rules for Materials and Welding requirements.',
      zh: 'ABS船用蝶阀型式认证，确保符合ABS材料和焊接规则要求。',
      ja: 'ABSの材料および溶接規則への準拠を保証する船舶用バタフライバルブのABS型式承認。',
      ar: 'موافقة النوع من مكتب الشحن الأمريكي لصمامات الفراشة البحرية.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2027-04-15T00:00:00.000Z',
    createdAt: '2024-04-15T00:00:00.000Z',
  },
  {
    id: '8',
    name: 'OHSAS 18001',
    issuer: 'SGS',
    description: {
      en: 'Occupational Health and Safety Management System certification, ensuring a safe working environment across all manufacturing facilities.',
      zh: '职业健康安全管理体系认证，确保所有生产设施的安全工作环境。',
      ja: '全製造施設における安全な作業環境を保証する労働安全衛生マネジメントシステム認証。',
      ar: 'شهادة نظام إدارة الصحة والسلامة المهنية، لضمان بيئة عمل آمنة في جميع مرافق التصنيع.',
    },
    image: null,
    pdfUrl: null,
    validUntil: '2026-08-30T00:00:00.000Z',
    createdAt: '2023-08-30T00:00:00.000Z',
  },
];

export default async function CertificatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('certificates');
  const navT = await getTranslations('nav');
  const aboutT = await getTranslations('about');

  // Try DB first
  let certificates: CertItem[];
  try {
    const dbCerts = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    if (dbCerts.length > 0) {
      certificates = dbCerts.map((c) => ({
        ...c,
        description: {
          en: `${c.name} certified by ${c.issuer}`,
          zh: `${c.name} 由 ${c.issuer} 认证`,
          ja: `${c.issuer}による${c.name}認証`,
          ar: `${c.name} معتمدة من ${c.issuer}`,
        },
        validUntil: c.validUntil?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
      }));
    } else {
      certificates = fallbackCertificates;
    }
  } catch {
    certificates = fallbackCertificates;
  }

  return (
    <>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.2),transparent_60%)]" />
        <div className="container-wide relative z-10">
          <Breadcrumb items={[{ label: navT('certificates') }]} />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mt-4">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl">
            {aboutT('qualDesc')}
          </p>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-white border-b border-slate-100">
        <div className="container-wide py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '50+', label: { en: 'Certifications', zh: '认证证书', ja: '認証', ar: 'شهادات' } },
              { value: '6', label: { en: 'Classification Societies', zh: '船级社', ja: '船級協会', ar: 'جمعيات التصنيف' } },
              { value: '20+', label: { en: 'Years Certified', zh: '年认证历史', ja: '年の認証実績', ar: 'سنوات معتمدة' } },
              { value: '100%', label: { en: 'Pass Rate', zh: '通过率', ja: '合格率', ar: 'معدل النجاح' } },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold text-primary-700">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {stat.label[locale as keyof typeof stat.label] || stat.label.en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certificates Grid */}
      <section className="section-padding bg-slate-50">
        <div className="container-wide">
          <CertificatesGrid certificates={certificates} locale={locale} />
        </div>
      </section>
    </>
  );
}
