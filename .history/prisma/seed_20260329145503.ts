/**
 * Prisma Seed Script — YuJiang ShipTechnology (禺疆船艇科技)
 *
 * Run with:  npx tsx prisma/seed.ts
 */

import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient()

// ── Deterministic UUIDs ────────────────────────────────────────

const CAT = {
  valves:     'c0000000-0000-4000-8000-000000000001',
  pumps:      'c0000000-0000-4000-8000-000000000002',
  deck:       'c0000000-0000-4000-8000-000000000003',
  navigation: 'c0000000-0000-4000-8000-000000000004',
  safety:     'c0000000-0000-4000-8000-000000000005',
  engine:     'c0000000-0000-4000-8000-000000000006',
}

const PROD = {
  gateValve:      'p0000000-0000-4000-8000-000000000001',
  butterflyValve: 'p0000000-0000-4000-8000-000000000002',
  centrifugal:    'p0000000-0000-4000-8000-000000000003',
  gearPump:       'p0000000-0000-4000-8000-000000000004',
  windlass:       'p0000000-0000-4000-8000-000000000005',
  crane:          'p0000000-0000-4000-8000-000000000006',
  radar:          'p0000000-0000-4000-8000-000000000007',
  gps:            'p0000000-0000-4000-8000-000000000008',
  liferaft:       'p0000000-0000-4000-8000-000000000009',
  fireExt:        'p0000000-0000-4000-8000-000000000010',
  piston:         'p0000000-0000-4000-8000-000000000011',
  turbocharger:   'p0000000-0000-4000-8000-000000000012',
}

const REV = {
  r1: 'r0000000-0000-4000-8000-000000000001',
  r2: 'r0000000-0000-4000-8000-000000000002',
  r3: 'r0000000-0000-4000-8000-000000000003',
  r4: 'r0000000-0000-4000-8000-000000000004',
  r5: 'r0000000-0000-4000-8000-000000000005',
  r6: 'r0000000-0000-4000-8000-000000000006',
}

const NEWS = {
  n1: 'n0000000-0000-4000-8000-000000000001',
  n2: 'n0000000-0000-4000-8000-000000000002',
  n3: 'n0000000-0000-4000-8000-000000000003',
  n4: 'n0000000-0000-4000-8000-000000000004',
}

const CASE = {
  cs1: 's0000000-0000-4000-8000-000000000001',
  cs2: 's0000000-0000-4000-8000-000000000002',
  cs3: 's0000000-0000-4000-8000-000000000003',
  cs4: 's0000000-0000-4000-8000-000000000004',
}

const CERT = {
  iso9001:  'e0000000-0000-4000-8000-000000000001',
  iso14001: 'e0000000-0000-4000-8000-000000000002',
  ce:       'e0000000-0000-4000-8000-000000000003',
  dnv:      'e0000000-0000-4000-8000-000000000004',
  ccs:      'e0000000-0000-4000-8000-000000000005',
}

const ADMIN_ID  = 'a0000000-0000-4000-8000-000000000001'

// ── Helpers ────────────────────────────────────────────────────

function specs(obj: Record<string, string | number>): string {
  return JSON.stringify(obj)
}

function images(...paths: string[]): string {
  return JSON.stringify(paths)
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('🌊 Seeding YuJiang ShipTechnology database …')

  // ── 1. Delete existing data (order respects FK constraints) ──
  await prisma.pageView.deleteMany()
  await prisma.inquiryItem.deleteMany()
  await prisma.inquiry.deleteMany()
  await prisma.visitor.deleteMany()
  await prisma.review.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.news.deleteMany()
  await prisma.caseStudy.deleteMany()
  await prisma.certificate.deleteMany()
  await prisma.adminUser.deleteMany()
  await prisma.siteSettings.deleteMany()
  await prisma.report.deleteMany()
  await prisma.contactMessage.deleteMany()

  console.log('  ✓ Cleared existing data')

  // ── 2. Categories ───────────────────────────────────────────
  await prisma.category.createMany({
    data: [
      {
        id: CAT.valves,
        slug: 'marine-valves',
        nameEn: 'Marine Valves',
        nameZh: '船用阀门',
        nameJa: '船艇用バルブ',
        nameAr: 'صمامات بحرية',
        image: '/images/categories/marine-valves.jpg',
      },
      {
        id: CAT.pumps,
        slug: 'ship-pumps',
        nameEn: 'Ship Pumps',
        nameZh: '船用泵',
        nameJa: '船艇用ポンプ',
        nameAr: 'مضخات السفن',
        image: '/images/categories/ship-pumps.jpg',
      },
      {
        id: CAT.deck,
        slug: 'deck-equipment',
        nameEn: 'Deck Equipment',
        nameZh: '甲板设备',
        nameJa: '甲板機器',
        nameAr: 'معدات السطح',
        image: '/images/categories/deck-equipment.jpg',
      },
      {
        id: CAT.navigation,
        slug: 'navigation-equipment',
        nameEn: 'Navigation Equipment',
        nameZh: '导航设备',
        nameJa: '航海機器',
        nameAr: 'معدات الملاحة',
        image: '/images/categories/navigation-equipment.jpg',
      },
      {
        id: CAT.safety,
        slug: 'safety-equipment',
        nameEn: 'Safety Equipment',
        nameZh: '安全设备',
        nameJa: '安全装置',
        nameAr: 'معدات السلامة',
        image: '/images/categories/safety-equipment.jpg',
      },
      {
        id: CAT.engine,
        slug: 'engine-parts',
        nameEn: 'Engine Parts',
        nameZh: '发动机配件',
        nameJa: 'エンジン部品',
        nameAr: 'قطع غيار المحركات',
        image: '/images/categories/engine-parts.jpg',
      },
    ],
  })
  console.log('  ✓ Categories (6)')

  // ── 3. Products ─────────────────────────────────────────────
  const products = [
    // ── Marine Valves ──
    {
      id: PROD.gateValve,
      slug: 'marine-bronze-gate-valve-jis-f7364',
      sku: 'YJ-MV-GV-001',
      nameEn: 'Marine Bronze Gate Valve JIS F7364',
      nameZh: '船用青铜闸阀 JIS F7364',
      nameJa: '船艇用青銅ゲートバルブ JIS F7364',
      nameAr: 'صمام بوابة برونزي بحري JIS F7364',
      descEn: 'High-performance marine bronze gate valve manufactured to JIS F7364 standard. Suitable for seawater, freshwater, and oil pipelines on merchant vessels and offshore platforms. Features a rising stem design with solid wedge disc for reliable shutoff.',
      descZh: '按照JIS F7364标准制造的高性能船用青铜闸阀。适用于商船和海上平台的海水、淡水和油管道系统。采用明杆设计和实心楔形阀瓣，确保可靠的截止性能。',
      descJa: 'JIS F7364規格に準拠した高性能船艇用青銅ゲートバルブ。商船や海洋プラットフォームの海水、淡水、油配管に適しています。ライジングステム設計とソリッドウェッジディスクにより、確実な遮断性能を提供します。',
      descAr: 'صمام بوابة برونزي بحري عالي الأداء مصنوع وفقًا لمعيار JIS F7364. مناسب لخطوط أنابيب مياه البحر والمياه العذبة والنفط على السفن التجارية والمنصات البحرية.',
      specsJson: specs({
        material: 'Bronze (CAC406)',
        standard: 'JIS F7364',
        pressure: '10K',
        sizeRange: 'DN15–DN150',
        connection: 'Flanged',
        stemType: 'Rising stem',
        weight: '5.8 kg (DN50)',
        certification: 'CCS, DNV-GL, BV',
        temperature: '-20°C to 200°C',
      }),
      priceUsd: 1850,
      moq: 10,
      leadTimeDays: 25,
      images: images('/images/products/product-1.jpg', '/images/products/product-1-2.jpg'),
      featured: true,
      published: true,
      categoryId: CAT.valves,
    },
    {
      id: PROD.butterflyValve,
      slug: 'wafer-type-butterfly-valve-dn200',
      sku: 'YJ-MV-BV-002',
      nameEn: 'Wafer-Type Marine Butterfly Valve DN200',
      nameZh: '对夹式船用蝶阀 DN200',
      nameJa: 'ウェーハ式船艇用バタフライバルブ DN200',
      nameAr: 'صمام فراشة بحري من نوع الرقاقة DN200',
      descEn: 'Compact wafer-type butterfly valve designed for marine piping systems. Aluminum bronze disc with EPDM seat provides excellent corrosion resistance in harsh saltwater environments. Quick quarter-turn operation with manual lever or optional pneumatic actuator.',
      descZh: '紧凑型对夹式蝶阀，专为船用管道系统设计。铝青铜阀瓣配合EPDM密封圈，在恶劣的盐水环境中具有出色的耐腐蚀性。支持手动手柄或可选气动执行器的快速四分之一转操作。',
      descJa: '船艇配管システム用に設計されたコンパクトなウェーハ式バタフライバルブ。アルミニウムブロンズディスクとEPDMシートにより、過酷な海水環境で優れた耐食性を発揮します。',
      descAr: 'صمام فراشة مدمج من نوع الرقاقة مصمم لأنظمة الأنابيب البحرية. قرص من البرونز الألومنيوم مع مقعد EPDM يوفر مقاومة ممتازة للتآكل.',
      specsJson: specs({
        material: 'Body: Ductile iron / Disc: Aluminum bronze',
        size: 'DN200',
        pressure: 'PN16',
        seatMaterial: 'EPDM',
        operation: 'Lever / Pneumatic actuator',
        weight: '18.5 kg',
        certification: 'CCS, CE',
        temperature: '-10°C to 120°C',
      }),
      priceUsd: 2450,
      moq: 5,
      leadTimeDays: 20,
      images: images('/images/products/product-2.jpg', '/images/products/product-2-2.jpg'),
      featured: false,
      published: true,
      categoryId: CAT.valves,
    },
    // ── Ship Pumps ──
    {
      id: PROD.centrifugal,
      slug: 'horizontal-centrifugal-sea-water-pump',
      sku: 'YJ-SP-CP-001',
      nameEn: 'Horizontal Centrifugal Sea Water Pump CWZ-50',
      nameZh: '卧式离心海水泵 CWZ-50',
      nameJa: '横型遠心式海水ポンプ CWZ-50',
      nameAr: 'مضخة طرد مركزي أفقية لمياه البحر CWZ-50',
      descEn: 'Self-priming horizontal centrifugal sea water pump for cooling and firefighting systems. Constructed with duplex stainless steel impeller for maximum corrosion resistance. Capable of handling seawater, ballast, and bilge duties.',
      descZh: '自吸式卧式离心海水泵，适用于冷却和消防系统。采用双相不锈钢叶轮，具有最大的耐腐蚀性。可处理海水、压载水和舱底排水。',
      descJa: '冷却および消火システム用の自吸式横型遠心海水ポンプ。二相ステンレス鋼インペラにより、最大限の耐食性を実現。海水、バラスト、ビルジ業務に対応可能。',
      descAr: 'مضخة طرد مركزي أفقية ذاتية التحضير لمياه البحر لأنظمة التبريد ومكافحة الحرائق. مصنوعة من دوار من الفولاذ المقاوم للصدأ المزدوج لأقصى مقاومة للتآكل.',
      specsJson: specs({
        model: 'CWZ-50',
        flowRate: '50 m³/h',
        head: '30 m',
        power: '15 kW',
        voltage: '380V / 440V, 50/60Hz',
        material: 'Casing: Bronze / Impeller: Duplex SS',
        inletOutlet: 'DN80 / DN65',
        weight: '185 kg',
        certification: 'CCS, DNV-GL',
      }),
      priceUsd: 8500,
      moq: 2,
      leadTimeDays: 35,
      images: images('/images/products/product-3.jpg', '/images/products/product-3-2.jpg'),
      featured: true,
      published: true,
      categoryId: CAT.pumps,
    },
    {
      id: PROD.gearPump,
      slug: 'marine-gear-oil-pump-2cy',
      sku: 'YJ-SP-GP-002',
      nameEn: 'Marine Gear Oil Transfer Pump 2CY Series',
      nameZh: '船用齿轮油泵 2CY系列',
      nameJa: '船艇用ギヤオイルポンプ 2CYシリーズ',
      nameAr: 'مضخة زيت تروس بحرية سلسلة 2CY',
      descEn: 'Heavy-duty gear oil pump for fuel oil and lubricating oil transfer on marine vessels. Features hardened alloy steel gears with precision machining for quiet, pulsation-free operation. Available in various flow rates from 1.5 to 38 m³/h.',
      descZh: '重型齿轮油泵，用于船艇上燃油和润滑油的输送。采用硬化合金钢齿轮和精密加工，运行安静且无脉动。提供1.5至38立方米/小时的多种流量规格。',
      descJa: '船艇における燃料油および潤滑油の移送用ヘビーデューティギヤオイルポンプ。硬化合金鋼ギヤと精密加工により、静かで脈動のない運転を実現。',
      descAr: 'مضخة زيت تروس ثقيلة لنقل زيت الوقود وزيت التشحيم على السفن البحرية. تتميز بتروس من سبائك الفولاذ المقسى مع تصنيع دقيق للتشغيل الهادئ.',
      specsJson: specs({
        model: '2CY-12/2.5',
        flowRate: '12 m³/h',
        pressure: '2.5 MPa',
        power: '7.5 kW',
        viscosity: '5–1500 cSt',
        material: 'Cast iron body / Alloy steel gears',
        weight: '96 kg',
        certification: 'CCS, BV',
      }),
      priceUsd: 4200,
      moq: 3,
      leadTimeDays: 28,
      images: images('/images/products/product-4.jpg'),
      featured: false,
      published: true,
      categoryId: CAT.pumps,
    },
    // ── Deck Equipment ──
    {
      id: PROD.windlass,
      slug: 'electric-anchor-windlass-30t',
      sku: 'YJ-DE-WL-001',
      nameEn: 'Electric Anchor Windlass 30T',
      nameZh: '电动锚机 30T',
      nameJa: '電動アンカーウインドラス 30T',
      nameAr: 'رافعة مرساة كهربائية 30 طن',
      descEn: 'Heavy-duty electric anchor windlass with 30-tonne pull capacity for medium to large vessels. Equipped with electromagnetic brake and manual emergency release. Designed for reliable anchoring operations in all sea conditions.',
      descZh: '重型电动锚机，额定拉力30吨，适用于中大型船艇。配备电磁制动器和手动紧急释放装置。专为各种海况下的可靠锚泊操作而设计。',
      descJa: '中型から大型船艇向けの30トン牽引力を持つヘビーデューティ電動アンカーウインドラス。電磁ブレーキと手動緊急解放装置を装備。あらゆる海況で信頼性の高い錨泊作業を実現。',
      descAr: 'رافعة مرساة كهربائية ثقيلة بسعة سحب 30 طنًا للسفن المتوسطة والكبيرة. مجهزة بفرامل كهرومغناطيسية وإطلاق طوارئ يدوي.',
      specsJson: specs({
        ratedPull: '30 tonnes',
        chainDiameter: '56–78 mm',
        speed: '9 m/min',
        power: '55 kW',
        voltage: '380V / 440V, 50/60Hz',
        chainWildcat: 'Grade U3',
        weight: '8500 kg',
        certification: 'CCS, DNV-GL, LR',
      }),
      priceUsd: 45000,
      moq: 1,
      leadTimeDays: 60,
      images: images('/images/products/product-5.jpg', '/images/products/product-5-2.jpg'),
      featured: true,
      published: true,
      categoryId: CAT.deck,
    },
    {
      id: PROD.crane,
      slug: 'marine-hydraulic-deck-crane-5t',
      sku: 'YJ-DE-CR-002',
      nameEn: 'Marine Hydraulic Deck Crane 5T-12M',
      nameZh: '船用液压甲板起重机 5T-12M',
      nameJa: '船艇用油圧デッキクレーン 5T-12M',
      nameAr: 'رافعة سطح هيدروليكية بحرية 5 طن-12 متر',
      descEn: 'Telescopic boom hydraulic deck crane with 5-tonne capacity at 12-meter outreach. Ideal for cargo handling, provision loading, and offshore support. Features 360° continuous slewing and proportional remote control.',
      descZh: '伸缩臂液压甲板起重机，12米臂距时起吊能力5吨。适用于货物装卸、补给装载和海上支援。支持360°连续回转和比例遥控。',
      descJa: '12メートルアウトリーチで5トンの吊上能力を持つ伸縮ブーム油圧デッキクレーン。貨物ハンドリング、補給積載、オフショアサポートに最適。360°連続旋回と比例リモートコントロールを搭載。',
      descAr: 'رافعة سطح هيدروليكية ذات ذراع تلسكوبي بسعة 5 أطنان عند مدى 12 مترًا. مثالية لمناولة البضائع والتحميل والدعم البحري.',
      specsJson: specs({
        capacity: '5 tonnes @ 12 m',
        maxOutreach: '12 m',
        boomType: 'Telescopic',
        slewing: '360° continuous',
        hoistSpeed: '20 m/min',
        power: '37 kW hydraulic unit',
        weight: '6200 kg',
        certification: 'CCS, DNV-GL, ABS',
      }),
      priceUsd: 38000,
      moq: 1,
      leadTimeDays: 55,
      images: images('/images/products/product-6.jpg', '/images/products/product-6-2.jpg'),
      featured: false,
      published: true,
      categoryId: CAT.deck,
    },
    // ── Navigation Equipment ──
    {
      id: PROD.radar,
      slug: 'marine-navigation-radar-x-band',
      sku: 'YJ-NE-RD-001',
      nameEn: 'Marine X-Band Navigation Radar 25kW',
      nameZh: '船用X波段导航雷达 25kW',
      nameJa: '船艇用Xバンド航海レーダー 25kW',
      nameAr: 'رادار ملاحة بحري نطاق X بقدرة 25 كيلوواط',
      descEn: 'High-resolution X-Band navigation radar system with 25kW magnetron transmitter. Provides exceptional target detection in all weather conditions. Features ARPA target tracking, AIS overlay, and chart radar integration for SOLAS-compliant vessels.',
      descZh: '高分辨率X波段导航雷达系统，配备25kW磁控管发射器。在各种天气条件下提供出色的目标探测能力。具备ARPA目标跟踪、AIS叠加和海图雷达集成功能，符合SOLAS公约船艇要求。',
      descJa: '25kWマグネトロン送信機を搭載した高解像度Xバンド航海レーダーシステム。あらゆる気象条件で優れたターゲット検出を実現。ARPA目標追跡、AISオーバーレイ、チャートレーダー統合機能搭載。',
      descAr: 'نظام رادار ملاحة عالي الدقة بنطاق X مع جهاز إرسال مغنترون بقدرة 25 كيلوواط. يوفر كشفًا استثنائيًا للأهداف في جميع الظروف الجوية.',
      specsJson: specs({
        band: 'X-Band (9.41 GHz)',
        power: '25 kW',
        range: '0.125–96 NM',
        antennaSize: '6 ft (1.8 m) open array',
        display: '19-inch color LCD',
        features: 'ARPA, AIS overlay, chart radar',
        weight: '28 kg (antenna) + 15 kg (processor)',
        certification: 'IMO, IEC 62388, CCS',
      }),
      priceUsd: 28000,
      moq: 1,
      leadTimeDays: 30,
      images: images('/images/products/product-7.jpg'),
      featured: true,
      published: true,
      categoryId: CAT.navigation,
    },
    {
      id: PROD.gps,
      slug: 'dgps-navigation-receiver',
      sku: 'YJ-NE-GP-002',
      nameEn: 'Marine DGPS Navigation Receiver YJ-GPS200',
      nameZh: '船用差分GPS导航接收机 YJ-GPS200',
      nameJa: '船艇用DGPS航法受信機 YJ-GPS200',
      nameAr: 'جهاز استقبال ملاحة DGPS بحري YJ-GPS200',
      descEn: 'Multi-constellation DGPS receiver supporting GPS, GLONASS, and BeiDou for centimeter-level positioning accuracy. Compact marine-grade unit with 7-inch sunlight-readable display. Integrates with autopilot, ECDIS, and AIS systems via NMEA 0183/2000.',
      descZh: '多星座差分GPS接收机，支持GPS、GLONASS和北斗卫星系统，厘米级定位精度。紧凑型船用级设备，配备7英寸阳光可读显示屏。通过NMEA 0183/2000与自动舵、ECDIS和AIS系统集成。',
      descJa: 'GPS、GLONASS、BeiDouをサポートするマルチコンステレーションDGPS受信機。センチメートルレベルの測位精度を実現。7インチ日光可読ディスプレイ搭載のコンパクトな船艇グレードユニット。',
      descAr: 'جهاز استقبال DGPS متعدد الأبراج يدعم GPS وGLONASS وBeiDou لدقة تحديد المواقع بمستوى السنتيمتر.',
      specsJson: specs({
        model: 'YJ-GPS200',
        constellations: 'GPS / GLONASS / BeiDou',
        accuracy: '< 1 m (DGPS), < 2.5 m (standalone)',
        display: '7-inch color TFT',
        interface: 'NMEA 0183 / NMEA 2000',
        waterproof: 'IPX6',
        power: '12–36 VDC',
        weight: '1.8 kg',
        certification: 'IMO, IEC 61108, CCS',
      }),
      priceUsd: 5600,
      moq: 2,
      leadTimeDays: 20,
      images: images('/images/products/product-8.jpg'),
      featured: false,
      published: true,
      categoryId: CAT.navigation,
    },
    // ── Safety Equipment ──
    {
      id: PROD.liferaft,
      slug: 'solas-inflatable-life-raft-25p',
      sku: 'YJ-SE-LR-001',
      nameEn: 'SOLAS Approved Inflatable Life Raft 25 Person',
      nameZh: 'SOLAS认证充气救生筏 25人',
      nameJa: 'SOLAS承認膨張式救命いかだ 25人用',
      nameAr: 'طوافة نجاة قابلة للنفخ معتمدة من SOLAS لـ 25 شخصًا',
      descEn: 'SOLAS-approved throw-over type inflatable life raft for 25 persons. Packed in fiberglass container with hydrostatic release unit. Equipped with SOLAS A pack survival equipment including water, rations, flares, and first aid kit.',
      descZh: 'SOLAS认证抛投式充气救生筏，可容纳25人。装于玻璃钢容器内，配静水压力释放装置。配备SOLAS A级求生设备包，包括饮用水、口粮、信号弹和急救箱。',
      descJa: '25人用SOLAS承認投下式膨張式救命いかだ。FRPコンテナにハイドロスタティックリリースユニット付きで格納。SOLAS Aパックサバイバル装備を搭載。',
      descAr: 'طوافة نجاة قابلة للنفخ معتمدة من SOLAS من نوع الرمي لـ 25 شخصًا. معبأة في حاوية من الألياف الزجاجية مع وحدة تحرير هيدروستاتيكية.',
      specsJson: specs({
        type: 'Throw-over',
        capacity: '25 persons',
        standard: 'SOLAS (MSC.48(66))',
        container: 'Fiberglass (GRP)',
        survivalPack: 'SOLAS A pack',
        dimensions: '1150 x 600 x 480 mm (packed)',
        weight: '145 kg',
        certification: 'CCS, DNV-GL, USCG',
        serviceInterval: '12 months',
      }),
      priceUsd: 3800,
      moq: 4,
      leadTimeDays: 15,
      images: images('/images/products/product-9.jpg', '/images/products/product-9-2.jpg'),
      featured: true,
      published: true,
      categoryId: CAT.safety,
    },
    {
      id: PROD.fireExt,
      slug: 'marine-co2-fire-extinguishing-system',
      sku: 'YJ-SE-FE-002',
      nameEn: 'Marine CO₂ Fixed Fire Extinguishing System',
      nameZh: '船用CO₂固定灭火系统',
      nameJa: '船艇用CO₂固定消火システム',
      nameAr: 'نظام إطفاء حريق ثابت بثاني أكسيد الكربون بحري',
      descEn: 'Total-flooding CO₂ fire extinguishing system for engine rooms and cargo holds. Automatic and manual release with time-delay alarm for crew evacuation. System includes high-pressure cylinders, manifold, piping, nozzles, and control cabinet.',
      descZh: '全淹没式CO₂灭火系统，适用于机舱和货舱。具有自动和手动释放功能，配备延时报警装置以便船员撤离。系统包括高压气瓶、汇流排、管路、喷嘴和控制柜。',
      descJa: '機関室および貨物倉用の全域浸水CO₂消火システム。乗員退避用のタイムディレイアラーム付き自動・手動放出機能。高圧シリンダー、マニホールド、配管、ノズル、制御盤を含むシステム。',
      descAr: 'نظام إطفاء حريق بثاني أكسيد الكربون شامل لغرف المحركات وعنابر الشحن. إطلاق تلقائي ويدوي مع إنذار تأخير زمني لإخلاء الطاقم.',
      specsJson: specs({
        type: 'Total flooding, high pressure',
        agent: 'CO₂ (food grade)',
        cylinderCapacity: '45 kg per cylinder',
        systemCapacity: '16–120 cylinders',
        operatingPressure: '15 MPa',
        release: 'Automatic / Manual / Emergency',
        weight: 'Varies by configuration',
        certification: 'SOLAS, CCS, DNV-GL',
      }),
      priceUsd: 12500,
      moq: 1,
      leadTimeDays: 40,
      images: images('/images/products/product-10.jpg'),
      featured: false,
      published: true,
      categoryId: CAT.safety,
    },
    // ── Engine Parts ──
    {
      id: PROD.piston,
      slug: 'marine-diesel-engine-piston-man-b-w',
      sku: 'YJ-EP-PS-001',
      nameEn: 'Marine Diesel Engine Piston for MAN B&W S50MC',
      nameZh: '船用柴油机活塞 适配MAN B&W S50MC',
      nameJa: '船艇用ディーゼルエンジンピストン MAN B&W S50MC対応',
      nameAr: 'مكبس محرك ديزل بحري لـ MAN B&W S50MC',
      descEn: 'OEM-quality replacement piston for MAN B&W S50MC two-stroke marine diesel engines. Precision-machined from high-grade nodular cast iron with chrome-ceramic coated piston crown. Drop-in replacement with no modification needed.',
      descZh: 'OEM品质的MAN B&W S50MC二冲程船用柴油机替换活塞。采用高品质球墨铸铁精密加工，活塞冠部带铬陶瓷涂层。直接替换安装，无需改装。',
      descJa: 'MAN B&W S50MC 2ストローク船艇用ディーゼルエンジン用OEM品質交換ピストン。高品質球状黒鉛鋳鉄から精密加工。クロムセラミックコーティングピストンクラウン。',
      descAr: 'مكبس بديل بجودة OEM لمحركات الديزل البحرية MAN B&W S50MC ثنائية الأشواط. مصنوع بدقة من حديد الزهر العقدي عالي الجودة.',
      specsJson: specs({
        compatibleEngine: 'MAN B&W S50MC / S50MC-C',
        bore: '500 mm',
        material: 'Nodular cast iron (GGG-70)',
        crownCoating: 'Chrome-ceramic',
        ringGrooves: '4 compression + 1 oil',
        weight: '420 kg',
        certification: 'CCS, DNV-GL, BV',
        warranty: '18 months',
      }),
      priceUsd: 15800,
      moq: 2,
      leadTimeDays: 45,
      images: images('/images/products/product-11.jpg', '/images/products/product-11-2.jpg'),
      featured: false,
      published: true,
      categoryId: CAT.engine,
    },
    {
      id: PROD.turbocharger,
      slug: 'marine-turbocharger-tl-series',
      sku: 'YJ-EP-TC-002',
      nameEn: 'Marine Turbocharger Assembly TL-350R',
      nameZh: '船用涡轮增压器总成 TL-350R',
      nameJa: '船艇用ターボチャージャーアセンブリ TL-350R',
      nameAr: 'مجموعة الشاحن التوربيني البحري TL-350R',
      descEn: 'High-efficiency marine turbocharger for medium-speed four-stroke diesel engines rated 3000–6000 kW. Radial turbine and centrifugal compressor design with water-cooled bearing housing. Complete assembly with inlet casing, nozzle ring, and silencer.',
      descZh: '高效船用涡轮增压器，适用于功率3000-6000千瓦的中速四冲程柴油机。径流涡轮和离心压缩机设计，水冷轴承箱。完整总成包括进气壳体、喷嘴环和消音器。',
      descJa: '出力3000～6000kWの中速4ストロークディーゼルエンジン用高効率船艇用ターボチャージャー。ラジアルタービンと遠心圧縮機設計、水冷ベアリングハウジング。',
      descAr: 'شاحن توربيني بحري عالي الكفاءة لمحركات الديزل رباعية الأشواط متوسطة السرعة بقدرة 3000-6000 كيلوواط.',
      specsJson: specs({
        model: 'TL-350R',
        enginePower: '3000–6000 kW',
        turbineType: 'Radial flow',
        compressorType: 'Centrifugal',
        pressureRatio: '4.2:1',
        maxSpeed: '18000 RPM',
        cooling: 'Water-cooled bearing',
        weight: '1350 kg',
        certification: 'CCS, DNV-GL, LR',
      }),
      priceUsd: 48000,
      moq: 1,
      leadTimeDays: 50,
      images: images('/images/products/product-12.jpg', '/images/products/product-12-2.jpg'),
      featured: true,
      published: true,
      categoryId: CAT.engine,
    },
  ]

  for (const p of products) {
    await prisma.product.create({ data: p })
  }
  console.log(`  ✓ Products (${products.length})`)

  // ── 4. Reviews ──────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        id: REV.r1,
        productId: PROD.gateValve,
        author: 'Andreas Müller',
        company: 'Hamburg Schiffbau GmbH',
        country: 'Germany',
        rating: 5,
        contentEn: 'Excellent quality gate valves. We ordered 200 units for a bulk carrier project and every single one passed our QC inspection. The bronze casting is very clean, and delivery was on schedule. Will order again.',
        contentZh: '闸阀质量优异。我们为一个散货船项目订购了200台，每一台都通过了质检。青铜铸件非常干净，交付准时。将继续合作。',
        approved: true,
      },
      {
        id: REV.r2,
        productId: PROD.centrifugal,
        author: 'Park Joon-ho',
        company: 'Busan Marine Industries Co., Ltd.',
        country: 'South Korea',
        rating: 5,
        contentEn: 'The CWZ-50 pump has been running for over 8 months on our 40,000 DWT tanker without any issues. The duplex stainless steel impeller shows no sign of corrosion. Very good price-performance ratio.',
        contentZh: 'CWZ-50泵在我们4万载重吨油轮上运行超过8个月，没有任何问题。双相不锈钢叶轮没有腐蚀迹象。性价比非常好。',
        approved: true,
      },
      {
        id: REV.r3,
        productId: PROD.windlass,
        author: 'Dimitrios Papadopoulos',
        company: 'Aegean Shipping S.A.',
        country: 'Greece',
        rating: 4,
        contentEn: 'Solid windlass, good build quality. Installation was straightforward with clear documentation. The electromagnetic brake works perfectly. One minor suggestion: include spare brake pads in the delivery.',
        contentZh: '锚机坚固耐用，做工精良。安装便捷，文档清晰。电磁制动器工作完美。一个小建议：随货附带备用刹车片。',
        approved: true,
      },
      {
        id: REV.r4,
        productId: PROD.radar,
        author: 'Captain James Thompson',
        company: 'Pacific Ocean Transport Ltd.',
        country: 'Singapore',
        rating: 5,
        contentEn: 'This radar system performs superbly in heavy rain and sea clutter conditions. ARPA tracking is accurate and the AIS integration works seamlessly with our ECDIS. A great cost-effective alternative to Japanese brands.',
        contentZh: '该雷达系统在大雨和海面杂波条件下表现出色。ARPA跟踪准确，AIS集成与我们的ECDIS无缝配合。是日本品牌的高性价比替代品。',
        approved: true,
      },
      {
        id: REV.r5,
        productId: PROD.liferaft,
        author: 'Ahmed Al-Rashidi',
        company: 'Gulf Maritime Services',
        country: 'UAE',
        rating: 5,
        contentEn: 'We replaced all life rafts on our fleet of 12 vessels with YuJiang rafts. CCS and DNV-GL certified, the quality meets international standards. Their after-sales service for annual inspections is also very reliable.',
        contentZh: '我们用禺疆救生筏替换了旗下12艘船艇上所有的救生筏。CCS和DNV-GL认证，质量符合国际标准。年检方面的售后服务也非常可靠。',
        approved: true,
      },
      {
        id: REV.r6,
        productId: PROD.turbocharger,
        author: 'Roberto Silva',
        company: 'Navegação Santos Ltda.',
        country: 'Brazil',
        rating: 4,
        contentEn: 'The TL-350R turbocharger was a perfect fit for our Wärtsilä 6L46 engine replacement project. Performance matches the original unit. The YuJiang engineering team provided excellent technical support during commissioning.',
        contentZh: 'TL-350R涡轮增压器非常适合我们的Wärtsilä 6L46发动机更换项目。性能与原装设备一致。禺疆工程团队在调试期间提供了出色的技术支持。',
        approved: true,
      },
    ],
  })
  console.log('  ✓ Reviews (6)')

  // ── 5. News ─────────────────────────────────────────────────
  await prisma.news.createMany({
    data: [
      {
        id: NEWS.n1,
        slug: 'yujiang-wins-offshore-wind-contract-2024',
        titleEn: 'YuJiang ShipTechnology Wins Major Offshore Wind Farm Vessel Equipment Contract',
        titleZh: '禺疆船艇科技赢得大型海上风电船艇设备合同',
        titleJa: '禺疆船艇科技が大型洋上風力発電船艇設備契約を獲得',
        titleAr: 'يوجيانغ لتكنولوجيا السفن تفوز بعقد كبير لمعدات سفن مزارع الرياح البحرية',
        contentEn: 'YuJiang ShipTechnology has been awarded a significant contract to supply marine valves, pumps, and deck equipment for a fleet of six new offshore wind farm installation vessels being built at Jiangnan Shipyard. The contract, valued at approximately $8.5 million, marks the company\'s largest single order in the renewable energy sector. CEO Mr. Zhang Wei stated: "This contract validates our long-term strategy to expand into the growing offshore wind market. Our products meet the stringent requirements of this demanding application."',
        contentZh: '禺疆船艇科技获得了一份重大合同，为江南造船厂正在建造的六艘新型海上风电安装船提供船用阀门、泵和甲板设备。该合同价值约850万美元，是公司在可再生能源领域的最大单笔订单。首席执行官张伟先生表示："这份合同验证了我们拓展不断增长的海上风电市场的长期战略。我们的产品满足这一高要求应用的严格标准。"',
        contentJa: '禺疆船艇科技は、江南造船所で建造中の6隻の新型洋上風力発電設置船に船艇用バルブ、ポンプ、甲板機器を供給する大型契約を受注しました。',
        contentAr: 'فازت يوجيانغ لتكنولوجيا السفن بعقد كبير لتوريد الصمامات البحرية والمضخات ومعدات السطح لأسطول من ست سفن جديدة لتركيب مزارع الرياح البحرية.',
        excerpt: 'YuJiang secures $8.5M contract to supply marine equipment for six offshore wind farm installation vessels.',
        image: '/images/news/offshore-wind-contract.jpg',
        published: true,
      },
      {
        id: NEWS.n2,
        slug: 'imo-2025-emission-regulations-impact',
        titleEn: 'How IMO 2025 Emission Regulations Are Reshaping Marine Equipment Demand',
        titleZh: 'IMO 2025排放法规如何重塑船艇设备需求',
        titleJa: 'IMO 2025排出規制が船艇機器需要をどう変えるか',
        titleAr: 'كيف تعيد لوائح انبعاثات IMO 2025 تشكيل الطلب على المعدات البحرية',
        contentEn: 'The International Maritime Organization\'s tightening emission standards are driving a surge in demand for fuel-efficient marine engine components and exhaust treatment systems. Ship owners worldwide are retrofitting their fleets to comply with the latest EEXI and CII requirements. YuJiang ShipTechnology has responded by developing a new line of low-emission compatible turbochargers and fuel injection components that help vessel operators reduce their carbon intensity without sacrificing performance.',
        contentZh: '国际海事组织不断收紧的排放标准正在推动对节能船用发动机零部件和尾气处理系统的需求激增。全球船东正在改装船队以符合最新的EEXI和CII要求。禺疆船艇科技已开发出新型低排放兼容涡轮增压器和燃油喷射组件系列产品，帮助船艇运营商在不牺牲性能的情况下降低碳强度。',
        contentJa: '国際海事機関の排出基準の厳格化により、燃料効率の高い船艇用エンジン部品と排ガス処理システムの需要が急増しています。',
        contentAr: 'تدفع معايير الانبعاثات المشددة للمنظمة البحرية الدولية إلى زيادة الطلب على مكونات المحركات البحرية الموفرة للوقود وأنظمة معالجة العوادم.',
        excerpt: 'IMO emission standards drive demand for fuel-efficient marine engine components and exhaust treatment systems.',
        image: '/images/news/imo-emissions.jpg',
        published: true,
      },
      {
        id: NEWS.n3,
        slug: 'marintec-china-2024-exhibition-recap',
        titleEn: 'YuJiang ShipTechnology Showcases Smart Marine Solutions at Marintec China 2024',
        titleZh: '禺疆船艇科技在2024中国国际海事技术学术会议上展示智能海事解决方案',
        titleJa: '禺疆船艇科技が2024年中国国際海事技術会議でスマート海事ソリューションを展示',
        titleAr: 'يوجيانغ لتكنولوجيا السفن تعرض حلول بحرية ذكية في مارينتك الصين 2024',
        contentEn: 'At Marintec China 2024 in Shanghai, YuJiang ShipTechnology unveiled its latest IoT-enabled marine valve monitoring system and a next-generation energy-efficient centrifugal pump series. The company\'s booth attracted considerable attention from international buyers, with delegations from Japan, South Korea, Greece, and Norway expressing strong interest. Over 150 business inquiries were received during the four-day event.',
        contentZh: '在上海举办的2024中国国际海事技术学术会议上，禺疆船艇科技发布了最新的物联网船用阀门监控系统和新一代节能离心泵系列。公司展位吸引了国际买家的广泛关注，来自日本、韩国、希腊和挪威的代表团表达了浓厚兴趣。在为期四天的展会中共收到超过150个商务咨询。',
        contentJa: '上海で開催されたMarintec China 2024で、禺疆船艇科技は最新のIoT対応船艇用バルブ監視システムと次世代省エネ遠心ポンプシリーズを発表しました。',
        contentAr: 'كشفت يوجيانغ لتكنولوجيا السفن في مارينتك الصين 2024 بشنغهاي عن أحدث نظام مراقبة صمامات بحرية مزود بإنترنت الأشياء وسلسلة مضخات طرد مركزي موفرة للطاقة.',
        excerpt: 'YuJiang unveils IoT-enabled valve monitoring and energy-efficient pump series at Marintec China 2024.',
        image: '/images/news/marintec-2024.jpg',
        published: true,
      },
      {
        id: NEWS.n4,
        slug: 'global-shipbuilding-order-book-q1-2025',
        titleEn: 'Global Shipbuilding Order Book Reaches 10-Year High in Q1 2025',
        titleZh: '2025年第一季度全球造船订单量达十年新高',
        titleJa: '2025年第1四半期の世界造船受注残高が10年ぶりの高水準に',
        titleAr: 'سجل الطلبات العالمي لبناء السفن يصل إلى أعلى مستوى في 10 سنوات في الربع الأول من 2025',
        contentEn: 'According to the latest Clarkson Research data, the global shipbuilding order book has reached its highest level in a decade, driven by container ship and LNG carrier orders. Chinese shipyards hold approximately 55% of the current order book by tonnage. Industry analysts note that this wave of new construction is generating strong demand for marine equipment suppliers, with delivery schedules extending into 2028. YuJiang ShipTechnology reports a 35% year-over-year increase in orders for the first quarter.',
        contentZh: '根据克拉克森研究的最新数据，受集装箱船和LNG运输船订单推动，全球造船订单量已达十年来最高水平。按吨位计算，中国造船厂约占当前订单的55%。行业分析师指出，这波新建造浪潮正在为船艇设备供应商带来强劲需求，交付计划已延伸至2028年。禺疆船艇科技第一季度订单同比增长35%。',
        contentJa: 'クラークソン・リサーチの最新データによると、コンテナ船とLNG船の受注に牽引され、世界の造船受注残高は過去10年で最高水準に達しました。',
        contentAr: 'وفقًا لأحدث بيانات أبحاث كلاركسون، وصل سجل طلبات بناء السفن العالمي إلى أعلى مستوى له في عقد، مدفوعًا بطلبات سفن الحاويات وناقلات الغاز الطبيعي المسال.',
        excerpt: 'Global shipbuilding order book hits decade high — YuJiang reports 35% YoY order growth in Q1.',
        image: '/images/news/shipbuilding-orders.jpg',
        source: 'Clarkson Research',
        published: true,
      },
    ],
  })
  console.log('  ✓ News (4)')

  // ── 6. Case Studies ─────────────────────────────────────────
  await prisma.caseStudy.createMany({
    data: [
      {
        id: CASE.cs1,
        slug: 'cosco-bulk-carrier-fleet-upgrade',
        titleEn: 'COSCO Shipping Bulk Carrier Fleet Valve Replacement Program',
        titleZh: '中远海运散货船队阀门更换项目',
        clientName: 'COSCO Shipping Lines',
        clientLogo: '/images/clients/cosco-logo.png',
        country: 'China',
        image: '/images/cases/cosco-project.jpg',
        contentEn: 'YuJiang ShipTechnology supplied over 3,000 marine bronze gate valves and butterfly valves for COSCO Shipping\'s fleet-wide valve replacement program covering 25 bulk carriers. The project required strict adherence to CCS classification standards and a phased delivery schedule synchronized with each vessel\'s dry-dock rotation. All valves were delivered on time across a 14-month period, with zero rejection rate at incoming inspection. The total contract value exceeded $2.8 million, and COSCO has since placed a follow-up order for their container vessel fleet.',
        contentZh: '禺疆船艇科技为中远海运的全船队阀门更换计划供应了3000多个船用青铜闸阀和蝶阀，覆盖25艘散货船。项目要求严格遵守CCS船级社标准，分阶段交付计划与每艘船的坞修轮换同步。所有阀门在14个月内准时交付，进货检验零退货率。合同总值超过280万美元，中远海运随后又为其集装箱船队追加了订单。',
        rating: 5,
      },
      {
        id: CASE.cs2,
        slug: 'norwegian-offshore-supply-vessels',
        titleEn: 'Farstad Shipping — Offshore Supply Vessel Pump Systems',
        titleZh: 'Farstad航运 — 海上供给船泵系统项目',
        clientName: 'Farstad Shipping ASA',
        clientLogo: '/images/clients/farstad-logo.png',
        country: 'Norway',
        image: '/images/cases/farstad-project.jpg',
        contentEn: 'Farstad Shipping selected YuJiang ShipTechnology as the pump system supplier for four new platform supply vessels being built at VARD shipyard. The scope included 32 centrifugal seawater pumps, 16 gear oil pumps, and 8 fire-fighting pump sets. YuJiang\'s engineering team worked closely with the VARD design department to optimize pump arrangements for the vessel\'s compact engine room layout. The project was completed two weeks ahead of schedule, and pump performance exceeded the specified efficiency targets by 3%.',
        contentZh: 'Farstad航运选择禺疆船艇科技作为VARD造船厂在建的四艘新型平台供给船的泵系统供应商。供货范围包括32台离心海水泵、16台齿轮油泵和8套消防泵组。禺疆工程团队与VARD设计部门密切合作，优化了紧凑机舱布局的泵组布置方案。项目提前两周完成，泵性能超出规定效率目标3%。',
        rating: 5,
      },
      {
        id: CASE.cs3,
        slug: 'emirates-cruise-ship-safety-systems',
        titleEn: 'Abu Dhabi Ports — Cruise Terminal Vessel Safety Equipment Supply',
        titleZh: '阿布扎比港口 — 邮轮码头船艇安全设备供应',
        clientName: 'Abu Dhabi Ports Group',
        clientLogo: '/images/clients/adports-logo.png',
        country: 'UAE',
        image: '/images/cases/adports-project.jpg',
        contentEn: 'YuJiang ShipTechnology was contracted by Abu Dhabi Ports Group to supply comprehensive safety equipment packages for their fleet of harbor tugs and pilot boats. The project included SOLAS-approved life rafts, CO₂ fire suppression systems, fire hose stations, and emergency signaling equipment. All products were delivered with CCS and DNV-GL dual certification. YuJiang also provided on-site installation supervision and crew training. The contract established YuJiang as the preferred safety equipment supplier for Abu Dhabi Ports\' ongoing fleet expansion program.',
        contentZh: '禺疆船艇科技与阿布扎比港口集团签约，为其港作拖轮和引航船队提供综合安全设备套装。项目包括SOLAS认证救生筏、CO₂灭火系统、消防水龙带站和应急信号设备。所有产品均提供CCS和DNV-GL双重认证。禺疆还提供了现场安装监督和船员培训。该合同使禺疆成为阿布扎比港口持续船队扩展计划的首选安全设备供应商。',
        rating: 5,
      },
      {
        id: CASE.cs4,
        slug: 'japan-lng-carrier-engine-overhaul',
        titleEn: 'NYK Line — LNG Carrier Engine Component Supply Program',
        titleZh: '日本邮船 — LNG运输船发动机零部件供应项目',
        clientName: 'Nippon Yusen Kabushiki Kaisha (NYK Line)',
        clientLogo: '/images/clients/nyk-logo.png',
        country: 'Japan',
        image: '/images/cases/nyk-project.jpg',
        contentEn: 'NYK Line partnered with YuJiang ShipTechnology for the supply of replacement pistons, turbocharger assemblies, and cylinder liners for their fleet of eight LNG carriers during scheduled engine overhauls. The parts were required to meet MAN B&W original specifications with DNV-GL and ClassNK certification. YuJiang\'s quality team implemented a dedicated production line with 100% dimensional inspection and material traceability. All 48 pistons and 16 turbocharger cartridges were delivered within tolerance, achieving a 99.7% dimensional compliance rate. The successful program led to a three-year framework agreement.',
        contentZh: '日本邮船与禺疆船艇科技合作，为其8艘LNG运输船在计划维修期间提供替换活塞、涡轮增压器总成和气缸套。零件需符合MAN B&W原厂规格，并获得DNV-GL和ClassNK认证。禺疆质量团队建立了专用生产线，进行100%尺寸检验和材料可追溯。所有48个活塞和16个涡轮增压器盘均在公差范围内交付，尺寸合格率达99.7%。项目的成功促成了三年框架协议。',
        rating: 5,
      },
    ],
  })
  console.log('  ✓ Case Studies (4)')

  // ── 7. Certificates ─────────────────────────────────────────
  await prisma.certificate.createMany({
    data: [
      {
        id: CERT.iso9001,
        name: 'ISO 9001:2015',
        issuer: 'TÜV Rheinland',
        image: '/images/certificates/iso-9001.jpg',
        pdfUrl: '/documents/certificates/iso-9001.pdf',
        validUntil: new Date('2027-06-30'),
      },
      {
        id: CERT.iso14001,
        name: 'ISO 14001:2015',
        issuer: 'TÜV Rheinland',
        image: '/images/certificates/iso-14001.jpg',
        pdfUrl: '/documents/certificates/iso-14001.pdf',
        validUntil: new Date('2027-06-30'),
      },
      {
        id: CERT.ce,
        name: 'CE Marking (PED 2014/68/EU)',
        issuer: 'Bureau Veritas',
        image: '/images/certificates/ce-marking.jpg',
        pdfUrl: '/documents/certificates/ce-marking.pdf',
        validUntil: new Date('2026-12-31'),
      },
      {
        id: CERT.dnv,
        name: 'DNV-GL Type Approval',
        issuer: 'DNV GL',
        image: '/images/certificates/dnv-gl.jpg',
        pdfUrl: '/documents/certificates/dnv-gl.pdf',
        validUntil: new Date('2027-03-15'),
      },
      {
        id: CERT.ccs,
        name: 'CCS Type Approval Certificate',
        issuer: 'China Classification Society',
        image: '/images/certificates/ccs.jpg',
        pdfUrl: '/documents/certificates/ccs.pdf',
        validUntil: new Date('2026-09-30'),
      },
    ],
  })
  console.log('  ✓ Certificates (5)')

  // ── 8. Admin User ───────────────────────────────────────────
  await prisma.adminUser.create({
    data: {
      id: ADMIN_ID,
      email: 'admin@yujiangshiptech.com',
      password: 'admin123',
      name: 'Admin',
      role: 'admin',
    },
  })
  console.log('  ✓ Admin User (1)')

  // ── 9. Site Settings ────────────────────────────────────────
  const settings: { id: string; key: string; value: string }[] = [
    { id: 'f0000000-0000-4000-8000-000000000001', key: 'company_name', value: 'YuJiang ShipTechnology' },
    { id: 'f0000000-0000-4000-8000-000000000002', key: 'company_name_zh', value: '禺疆船艇科技' },
    { id: 'f0000000-0000-4000-8000-000000000003', key: 'company_phone', value: '+86-574-8765-4321' },
    { id: 'f0000000-0000-4000-8000-000000000004', key: 'company_email', value: 'info@yujiangshiptech.com' },
    { id: 'f0000000-0000-4000-8000-000000000005', key: 'company_address', value: 'No. 88 Harbor Road, Beilun District, Ningbo, Zhejiang, China' },
    { id: 'f0000000-0000-4000-8000-000000000006', key: 'company_address_zh', value: '中国江苏省苏州市工业园区' },
    { id: 'f0000000-0000-4000-8000-000000000007', key: 'whatsapp_number', value: '+8613800138000' },
    { id: 'f0000000-0000-4000-8000-000000000008', key: 'linkedin_url', value: 'https://linkedin.com/company/yujiangshiptech' },
    { id: 'f0000000-0000-4000-8000-000000000009', key: 'youtube_url', value: 'https://youtube.com/@yujiangshiptech' },
  ]

  for (const s of settings) {
    await prisma.siteSettings.create({ data: s })
  }
  console.log(`  ✓ Site Settings (${settings.length})`)

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
