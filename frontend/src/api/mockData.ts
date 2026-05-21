import type {
  CountryNode,
  CountryDetail,
  SgRegion,
  RegionDetail,
  IntelEvent,
  Department,
} from './types'

// ── World map dots ──────────────────────────────────────────────

function generateContinentDots(): [number, number, number][] {
  const zones = [
    { cx: 280, cy: 230, rx: 180, ry: 140, density: 0.55 },
    { cx: 480, cy: 110, rx: 60,  ry: 60,  density: 0.4  },
    { cx: 430, cy: 540, rx: 100, ry: 170, density: 0.5  },
    { cx: 820, cy: 220, rx: 90,  ry: 80,  density: 0.55 },
    { cx: 880, cy: 460, rx: 130, ry: 180, density: 0.55 },
    { cx: 980, cy: 320, rx: 70,  ry: 70,  density: 0.5  },
    { cx: 1150,cy: 250, rx: 220, ry: 130, density: 0.55 },
    { cx: 1080,cy: 360, rx: 70,  ry: 70,  density: 0.5  },
    { cx: 1280,cy: 440, rx: 90,  ry: 60,  density: 0.5  },
    { cx: 1400,cy: 580, rx: 110, ry: 70,  density: 0.5  },
  ]
  const dots: [number, number, number][] = []
  let seed = 17
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
  zones.forEach(z => {
    const count = Math.floor(z.rx * z.ry * 0.012 * z.density)
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = Math.sqrt(rand())
      const x = z.cx + Math.cos(a) * r * z.rx + (rand() - 0.5) * 14
      const y = z.cy + Math.sin(a) * r * z.ry + (rand() - 0.5) * 14
      dots.push([x, y, 1.1 + rand() * 0.8])
    }
  })
  return dots
}

export const CONTINENT_DOTS = generateContinentDots()

export const COUNTRIES: CountryNode[] = [
  { id: 'sg', name: '新加坡', sub: 'Singapore',  x: 1240, y: 460, status: 'high',        size: 18 },
  { id: 'eu', name: '欧洲',   sub: 'Europe',     x: 820,  y: 220, status: 'regulation',  size: 16 },
  { id: 'na', name: '北美',   sub: 'N. America', x: 280,  y: 240, status: 'competition', size: 14 },
  { id: 'me', name: '中东',   sub: 'Mid. East',  x: 990,  y: 320, status: 'risk',        size: 14 },
  { id: 'la', name: '拉美',   sub: 'LATAM',      x: 430,  y: 520, status: 'watch',       size: 12 },
  { id: 'au', name: '澳洲',   sub: 'Oceania',    x: 1430, y: 580, status: 'watch',       size: 12 },
  { id: 'jp', name: '日本',   sub: 'Japan',      x: 1380, y: 280, status: 'high',        size: 14 },
  { id: 'in', name: '印度',   sub: 'India',      x: 1080, y: 380, status: 'competition', size: 12 },
]

export const COUNTRY_DETAIL: Record<string, CountryDetail> = {
  sg: {
    name: '新加坡', sub: 'Singapore', status: '机会增强', statusKind: 'sage',
    score: 82, competition: 4, competitionLabel: '中高',
    policy: '优', policyKind: 'sage', growth: '+12%',
    bullets: [
      { icon: 'diamond',   text: '高净值消费持续增长，奢侈品珠宝需求旺盛' },
      { icon: 'scale',     text: '自由贸易枢纽，关税政策友好' },
      { icon: 'trending',  text: '电商渠道渗透率提升，线上销售增长显著' },
      { icon: 'broadcast', text: '旅游零售恢复，机场免税业务回暖' },
    ],
    triggers: ['旅游零售恢复', '高端珠宝消费升温', '电商渠道增长', '竞争品牌加大投放'],
    impacts: [
      { kind: 'opportunity', text: '高净值客群触达窗口扩大' },
      { kind: 'risk',        text: '核心商圈竞争与租金压力上升' },
      { kind: 'watch',       text: '节日营销与竞品活动节奏' },
    ],
  },
  eu: {
    name: '欧洲', sub: 'Europe', status: '机会高', statusKind: 'sage',
    score: 76, competition: 5, competitionLabel: '高',
    policy: '中', policyKind: 'bone', growth: '+8%',
    bullets: [
      { icon: 'crown',  text: '传统高端珠宝市场，品牌信任度高' },
      { icon: 'shield', text: 'ESG 与供应链合规要求趋严' },
      { icon: 'wave',   text: '意大利与法国设计工艺溢价稳定' },
      { icon: 'users',  text: '本地高净值客群稳定，年轻化趋势显现' },
    ],
  },
  na: {
    name: '北美', sub: 'N. America', status: '机会中', statusKind: 'bone',
    score: 68, competition: 4, competitionLabel: '中高',
    policy: '良', policyKind: 'sage', growth: '+5%',
    bullets: [
      { icon: 'store',     text: '实验室培育钻石接受度领先全球' },
      { icon: 'trending',  text: '电商与社媒驱动年轻消费决策' },
      { icon: 'broadcast', text: '婚庆需求结构性放缓，礼赠场景上升' },
      { icon: 'shield',    text: '进口关税与原产地审核趋严' },
    ],
  },
  me: {
    name: '中东', sub: 'Middle East', status: '风险高', statusKind: 'clay',
    score: 54, competition: 3, competitionLabel: '中',
    policy: '波动', policyKind: 'clay', growth: '+2%',
    bullets: [
      { icon: 'alert', text: '区域地缘风险与汇率波动加剧' },
      { icon: 'crown', text: '高净值客群消费集中，仍具机会' },
      { icon: 'scale', text: '进口合规与本地化要求复杂' },
      { icon: 'store', text: '迪拜与利雅得线下渠道集中度高' },
    ],
  },
  la: {
    name: '拉美', sub: 'LATAM', status: '机会中', statusKind: 'bone',
    score: 58, competition: 2, competitionLabel: '中低',
    policy: '中', policyKind: 'bone', growth: '+6%',
    bullets: [
      { icon: 'trending', text: '新兴中产人群扩张，入门款机会显现' },
      { icon: 'wave',     text: '宏观波动较大，库存周转需谨慎' },
      { icon: 'users',    text: '婚庆与礼赠场景具备本地化潜力' },
      { icon: 'shield',   text: '海关与税务合规复杂，建议代理模式切入' },
    ],
  },
  au: {
    name: '澳洲', sub: 'Oceania', status: '机会中', statusKind: 'bone',
    score: 64, competition: 3, competitionLabel: '中',
    policy: '良', policyKind: 'sage', growth: '+4%',
    bullets: [
      { icon: 'mountain', text: '本地矿石产业与故事性资源丰富' },
      { icon: 'users',    text: '高端婚庆与生活方式消费稳定' },
      { icon: 'store',    text: '线下集中在悉尼、墨尔本核心商圈' },
      { icon: 'lab',      text: '可持续与培育钻石叙事接受度高' },
    ],
  },
  jp: {
    name: '日本', sub: 'Japan', status: '机会高', statusKind: 'sage',
    score: 78, competition: 4, competitionLabel: '中高',
    policy: '优', policyKind: 'sage', growth: '+7%',
    bullets: [
      { icon: 'crown', text: '本土工艺溢价稳定，婚戒市场成熟' },
      { icon: 'wave',  text: '汇率优势带动入境游客购物回升' },
      { icon: 'store', text: '百货 + 路面店组合渠道密度高' },
      { icon: 'users', text: 'Z 世代古典金饰需求升温' },
    ],
  },
  in: {
    name: '印度', sub: 'India', status: '机会中', statusKind: 'bone',
    score: 60, competition: 5, competitionLabel: '高',
    policy: '中', policyKind: 'bone', growth: '+11%',
    bullets: [
      { icon: 'trending', text: '黄金消费体量全球领先，本土品牌强势' },
      { icon: 'users',    text: '婚庆季节性消费集中' },
      { icon: 'scale',    text: '进口关税与黄金管制复杂' },
      { icon: 'lab',      text: '培育钻石产业链优势明显' },
    ],
  },
}

// ── Singapore regions ───────────────────────────────────────────

export const SG_REGIONS: SgRegion[] = [
  { id: 'orchard',  name: '乌节路', sub: 'Orchard',    x: 540, y: 340, stores: 5, hot: 'high', priority: true },
  { id: 'marina',   name: '滨海湾', sub: 'Marina Bay', x: 700, y: 425, stores: 3, hot: 'high' },
  { id: 'bugis',    name: '武吉士', sub: 'Bugis',      x: 600, y: 270, stores: 3, hot: 'high' },
  { id: 'jurong',   name: '裕廊东', sub: 'Jurong East',x: 280, y: 360, stores: 2, hot: 'mid'  },
  { id: 'tampines', name: '淡滨尼', sub: 'Tampines',   x: 830, y: 320, stores: 2, hot: 'mid'  },
  { id: 'changi',   name: '樟宜',   sub: 'Changi',     x: 940, y: 295, stores: 1, hot: 'mid'  },
  { id: 'cbd',      name: '市中心', sub: 'CBD',        x: 620, y: 405, stores: 3, hot: 'high' },
]

export const REGION_DETAIL: Record<string, RegionDetail> = {
  orchard: {
    name: '乌节路', sub: 'Orchard Road', priority: '高优先级区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '5',          unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '高',         valueClass: 'sage' },
      { icon: 'users',     label: '竞品密度', value: '高',         valueClass: 'clay' },
      { icon: 'broadcast', label: '客流结构', value: '游客 + 高净值本地', small: true },
    ],
    profile: {
      type: '高端商业核心区',
      scene: '奢侈品购物中心、婚庆珠宝、高端礼赠',
      consumption: '品牌导向强，客单价高',
      action: '品牌曝光、会员活动、节日营销',
    },
    insights: [
      'Aurum 门店密度最高，覆盖核心商圈',
      '周边高端珠宝品牌集中，比价压力可控',
      '适合品牌曝光与会员体验活动',
      '租金成本较高，需关注转化效率',
    ],
    actions: ['加强核心商场陈列与橱窗曝光', '策划高端礼赠主题活动', '监测 Maison Aurelia / Lune Atelier / Cartelle 等竞品动作'],
  },
  marina: {
    name: '滨海湾', sub: 'Marina Bay', priority: '高优先级区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '3',       unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '高',      valueClass: 'sage' },
      { icon: 'users',     label: '竞品密度', value: '中高',    valueClass: 'bone' },
      { icon: 'broadcast', label: '客流结构', value: '游客主导', small: true },
    ],
    profile: {
      type: '地标商业区',
      scene: '旅游购物、奢侈品零售、礼品',
      consumption: '客单价高，冲动购买比例高',
      action: '旅游营销、限定款、机场协同',
    },
    insights: ['地标商圈，旅游客流密集且消费力强', '免税与机场协同效应显著', '适合限定产品与故事性传播', '对汇率波动敏感，需动态定价'],
    actions: ['推出滨海湾限定纪念款系列', '联动机场免税与酒店礼宾渠道', '增加多语种导购与会员注册转化'],
  },
  bugis: {
    name: '武吉士', sub: 'Bugis', priority: '中优先级区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '3',        unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '中高',     valueClass: 'sage' },
      { icon: 'users',     label: '竞品密度', value: '中',       valueClass: 'bone' },
      { icon: 'broadcast', label: '客流结构', value: '本地年轻 + 游客', small: true },
    ],
    profile: {
      type: '年轻文化商业区',
      scene: '轻奢饰品、社交礼物、潮流配饰',
      consumption: '价格敏感，社媒驱动',
      action: '轻奢线、KOL 合作、社媒投放',
    },
    insights: ['Z 世代与年轻白领客流集中', '适合轻奢与日常佩戴系列推广', '本地 KOL 合作回报率高', '需要差异化产品策略避免与乌节路重叠'],
    actions: ['推广轻奢 Daily 系列', '本地 KOL 与小红书内容投放', '试点快闪体验店'],
  },
  cbd: {
    name: '市中心', sub: 'CBD', priority: '中优先级区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '3',       unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '中',      valueClass: 'bone' },
      { icon: 'users',     label: '竞品密度', value: '中',      valueClass: 'bone' },
      { icon: 'broadcast', label: '客流结构', value: '白领 + 商务客群', small: true },
    ],
    profile: {
      type: '金融商务核心',
      scene: '商务礼赠、轻奢自购、午休消费',
      consumption: '高频低额，注重服务',
      action: '工作日时段促销、企业礼赠',
    },
    insights: ['白领客群稳定，节假日客流回升明显', '适合商务礼赠与企业定制业务', '门店面积小但坪效高', '周末客流下降明显，需差异化经营'],
    actions: ['拓展企业礼赠 B2B 渠道', '推出商务系列与会员快捷服务', '优化周末活动与会员邀约'],
  },
  jurong: {
    name: '裕廊东', sub: 'Jurong East', priority: '中优先级区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '2',      unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '中',     valueClass: 'bone' },
      { icon: 'users',     label: '竞品密度', value: '低',     valueClass: 'sage' },
      { icon: 'broadcast', label: '客流结构', value: '本地家庭客群', small: true },
    ],
    profile: {
      type: '西部区域中心',
      scene: '婚庆珠宝、家庭礼赠',
      consumption: '重决策、注重性价比',
      action: '婚庆套餐、家庭活动',
    },
    insights: ['西部区域人口持续增长', '竞品密度低，市占率提升空间大', '婚庆与家庭礼赠场景突出', '需要本地化的婚庆服务体验'],
    actions: ['强化婚戒与对戒套餐推广', '举办家庭日与婚庆体验活动', '评估新增门店的开店时机'],
  },
  tampines: {
    name: '淡滨尼', sub: 'Tampines', priority: '中优先级区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '2',    unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '中',   valueClass: 'bone' },
      { icon: 'users',     label: '竞品密度', value: '低',   valueClass: 'sage' },
      { icon: 'broadcast', label: '客流结构', value: '本地通勤客群', small: true },
    ],
    profile: {
      type: '东部社区商业中心',
      scene: '日常配饰、通勤礼物、家庭',
      consumption: '稳定低额，复购为王',
      action: '会员复购、生日提醒',
    },
    insights: ['东部居民聚集，社区氛围浓', '复购率高于全岛均值', '可作为会员体系试点', '高端 SKU 销售较弱'],
    actions: ['推出社区会员日活动', '强化生日 / 纪念日提醒推送', '测试中高端 SKU 试销'],
  },
  changi: {
    name: '樟宜', sub: 'Changi', priority: '战略机场区域',
    metrics: [
      { icon: 'store',     label: '门店数量', value: '1',    unit: '家' },
      { icon: 'flame',     label: '商圈热力', value: '高',   valueClass: 'sage' },
      { icon: 'users',     label: '竞品密度', value: '高',   valueClass: 'clay' },
      { icon: 'broadcast', label: '客流结构', value: '国际游客', small: true },
    ],
    profile: {
      type: '国际机场免税区',
      scene: '免税、旅游伴手礼、限定款',
      consumption: '高客单、冲动型',
      action: '限定 SKU、礼盒、机场专属',
    },
    insights: ['国际客流密集，转化窗口窄', '需依赖明显视觉与礼盒包装', '免税价格优势对决策影响大', '受国际旅行波动影响明显'],
    actions: ['推出机场专属礼盒与限定款', '申请额外柜位与 visual 升级', '建立旅客 CRM 与离岛触达'],
  },
}

// ── Intelligence events ─────────────────────────────────────────

export const EVENTS: IntelEvent[] = [
  {
    id: 'e1', cat: '竞争',
    title: 'Maison Aurelia 收购意大利高级珠宝品牌 Damasco 多数股权',
    summary: 'Maison Aurelia 集团已签署协议收购意大利高级珠宝品牌 Damasco 的多数股权，进一步强化其在高端珠宝市场的布局。',
    source: '行业报告', srcDetail: 'Aurum Insight Quarterly',
    time: '05/31 09:30', priority: 'high', new: true,
    impact: [
      { kind: 'competitive', title: '竞争格局', text: 'Maison Aurelia 在高端珠宝领域的版图进一步扩大，提升议价与渠道整合能力。' },
      { kind: 'brand',       title: '品牌策略', text: 'Damasco 有望获得全球渠道资源与品牌曝光支持，同业品牌定位面临升级压力。' },
      { kind: 'trend',       title: '市场趋势', text: '意大利工艺与设计价值被进一步强化，利好同类品牌的定位升级。' },
    ],
    markets: ['欧洲', '北美', '中东', '亚太 (高端)'],
    brands: ['Maison Aurelia', 'Damasco', 'Lune Atelier', 'Cartelle'],
    citation: 'Aurum Insight Quarterly – Luxury Goods Market Outlook 2026',
    citationTime: '2026/05/31 09:30',
  },
  {
    id: 'e2', cat: '产品',
    title: '实验室培育钻石价格持续下行，需求分化加剧',
    summary: '5 月份培育钻石毛坯价格环比下降 6%–9%，进入消费淡季后，性价比产品需求走弱，高品质大克拉需求相对稳定。',
    source: '行业报告', srcDetail: 'Tenoris.BI',
    time: '05/30 16:45', priority: 'high',
    impact: [
      { kind: 'competitive', title: '竞争格局', text: '天然钻石与培育钻石定价差距继续扩大，分层销售策略空间放大。' },
      { kind: 'brand',       title: '品牌策略', text: '高端品牌可以强化天然钻石稀缺叙事；轻奢线可以借力培育钻石性价比。' },
      { kind: 'trend',       title: '市场趋势', text: '消费者教育成本上升，可追溯性与认证成为关键卖点。' },
    ],
    markets: ['北美', '欧洲', '亚太'],
    brands: ['Pandora', 'Maison Aurelia', 'Lab Origin', 'Brilliant Earth'],
    citation: 'Tenoris.BI – Diamond Price Monthly · May 2026',
    citationTime: '2026/05/30 16:45',
  },
  {
    id: 'e3', cat: '社媒',
    title: 'TikTok 上「Old Money 珠宝风」热度上升',
    summary: '#OldMoneyJewelry 话题播放量环比增长 38%，复古黄金与珍珠设计受 Z 世代青睐，欧美市场讨论度显著提升。',
    source: '社媒', srcDetail: 'TikTok Creative Center',
    time: '05/30 11:20', priority: 'mid',
    impact: [
      { kind: 'competitive', title: '竞争格局', text: '复古风系列受到 DTC 品牌追捧，相关 SKU 售罄率上升。' },
      { kind: 'brand',       title: '品牌策略', text: '适合推出复古金饰胶囊系列，借助社媒话题快速触达 Z 世代。' },
      { kind: 'trend',       title: '市场趋势', text: '「低调奢华」叙事正在与 Old Money 美学融合，长尾内容增长可期。' },
    ],
    markets: ['北美', '欧洲', '东南亚'],
    brands: ['Lune Atelier', 'Aurum Maison', 'Cartelle', 'Heritage Co.'],
    citation: 'TikTok Creative Center – Trend Pulse · May 2026',
    citationTime: '2026/05/30 11:20',
  },
  {
    id: 'e4', cat: '法规',
    title: '欧盟通过新规限制黄金供应链尽职调查标准',
    summary: '欧盟理事会通过新版尽职调查指令，要求贵金属与钻石供应链加强来源透明度，企业需在 2027 年前完成合规升级。',
    source: '政府官网', srcDetail: 'EUR-Lex',
    time: '05/29 18:05', priority: 'high',
    impact: [
      { kind: 'competitive', title: '竞争格局', text: '中小型供应商合规成本上升，集中度有望进一步提高。' },
      { kind: 'brand',       title: '品牌策略', text: '需要前置披露供应链来源与可追溯证书，强化品牌信任。' },
      { kind: 'trend',       title: '市场趋势', text: 'ESG 与供应链透明度成为高端市场准入门槛。' },
    ],
    markets: ['欧洲', '全球'],
    brands: ['全行业适用'],
    citation: 'EUR-Lex – Council Directive on Due Diligence (2026/337)',
    citationTime: '2026/05/29 18:05',
  },
  {
    id: 'e5', cat: '渠道',
    title: '亚马逊推出珠宝新品类流量扶持计划',
    summary: '面向美国站珠宝类目的卖家推出广告补贴与新品流量激励，持续 90 天，最高可获 15% 广告花费返还。',
    source: '新闻', srcDetail: 'Amazon Newsroom',
    time: '05/29 09:10', priority: 'mid',
    impact: [
      { kind: 'competitive', title: '竞争格局', text: '电商珠宝新品上架窗口期机会显著，DTC 品牌活跃度提升。' },
      { kind: 'brand',       title: '品牌策略', text: '适合借助流量扶持窗口测试新品类与定价策略。' },
      { kind: 'trend',       title: '市场趋势', text: '电商平台与品牌侧投放联动趋势加强。' },
    ],
    markets: ['北美'],
    brands: ['Amazon', 'DTC 品牌'],
    citation: 'Amazon Newsroom – Jewelry Seller Boost Program',
    citationTime: '2026/05/29 09:10',
  },
  {
    id: 'e6', cat: '竞争',
    title: 'Cartelle 新加坡乌节路旗舰店翻新启动',
    summary: 'Cartelle 宣布对新加坡乌节路旗舰店进行为期 3 个月的翻新升级，期间将开设临时体验店。',
    source: '新闻', srcDetail: 'Straits Times Lifestyle',
    time: '05/28 14:25', priority: 'mid',
    impact: [
      { kind: 'competitive', title: '竞争格局', text: '乌节路核心商圈短期内将释放约 5% 高端客流分流机会。' },
      { kind: 'brand',       title: '品牌策略', text: '建议在翻新窗口期加强乌节路曝光与会员邀约。' },
      { kind: 'trend',       title: '市场趋势', text: '旗舰店体验升级成为奢侈品零售竞争重点。' },
    ],
    markets: ['亚太', '新加坡'],
    brands: ['Cartelle'],
    citation: 'Straits Times Lifestyle · May 28, 2026',
    citationTime: '2026/05/28 14:25',
  },
  {
    id: 'e7', cat: '产品',
    title: '彩色宝石（碧玺、坦桑石）询价量持续走高',
    summary: 'Q2 彩色宝石询价指数环比增长 22%，高端定制订单占比扩大，年轻消费者偏好色彩个性化。',
    source: '行业报告', srcDetail: 'Color Stone Insight',
    time: '05/28 10:40', priority: 'mid',
    impact: [
      { kind: 'competitive', title: '竞争格局', text: '彩色宝石供应商议价能力上升，库存周转率成关键。' },
      { kind: 'brand',       title: '品牌策略', text: '建议丰富彩色宝石 SKU，强化「色彩 × 个性」叙事。' },
      { kind: 'trend',       title: '市场趋势', text: '彩色宝石与古典金属工艺组合成为新热点。' },
    ],
    markets: ['亚太', '北美'],
    brands: ['Color Atelier', 'Aurum Maison', 'Lune Atelier'],
    citation: 'Color Stone Insight – Q2 Demand Pulse',
    citationTime: '2026/05/28 10:40',
  },
]

// ── Departments ─────────────────────────────────────────────────

export const DEPTS: Department[] = [
  {
    id: 'mkt', name: '市场部', sub: 'Marketing', icon: 'diamond', priority: 'high',
    cycle: '本月', owner: '市场负责人 / 区域负责人',
    summary: [
      { text: '核心商圈曝光提升', when: '立即' },
      { text: '节日营销活动策划', when: '本月' },
      { text: 'KOL 内容合作拓展', when: '2 周内' },
      { text: '竞品投放监测',     when: '持续' },
    ],
    goal: '提升新加坡核心商圈品牌曝光与高净值客群触达',
    steps: [
      { title: '加大乌节路与滨海湾核心商圈投放', goal: '覆盖高净值客群与旅游消费人群', how: '投放商场屏幕广告、奢侈品会员渠道广告', when: '立即启动' },
      { title: '策划新加坡本地节日营销活动',     goal: '结合婚庆、礼赠、高端消费场景',     how: '推出限定款主题活动与门店预约体验',  when: '本月完成方案' },
      { title: '拓展本地 KOL / 珠宝生活方式博主合作', goal: '提升社媒声量与年轻客群触达', how: '筛选 10–15 位本地高净值生活方式 KOL', when: '2 周内完成名单' },
      { title: '建立竞品投放监测', goal: '跟踪 Maison Aurelia、Cartelle、Lune 等竞品动作', how: '每周汇总广告、活动、门店陈列变化', when: '持续执行' },
    ],
    refs: [
      { icon: 'map',   text: '地图洞察: 乌节路、滨海湾门店密度高' },
      { icon: 'feed',  text: '情报中心: 高端珠宝需求与旅游零售恢复' },
      { icon: 'alert', text: '风险提示: 核心商圈租金较高，需提升投放转化效率' },
    ],
  },
  {
    id: 'pdt', name: '产品部', sub: 'Product', icon: 'ring', priority: 'high',
    cycle: '本月', owner: '产品负责人 / 设计总监',
    summary: [
      { text: '轻奢系列新品开发',   when: '本月' },
      { text: '本地偏好款式优化',   when: '本月' },
      { text: '供应链交付周期优化', when: '持续' },
      { text: '可持续材质试点',     when: '本月' },
    ],
    goal: '面向亚太市场拓宽轻奢与可持续产品线，提升上新节奏',
    steps: [
      { title: '开发新加坡限定轻奢系列',   goal: '适配年轻客群与日常佩戴场景',   how: '联合本地设计师推出 8 SKU 胶囊系列',   when: '本月立项' },
      { title: '优化本地热销款式 SKU 结构', goal: '提升核心 SKU 库存周转率',       how: '下架长尾 SKU，强化热销款式备货',       when: '2 周内完成评估' },
      { title: '缩短亚太供应链交付周期',   goal: '支持快速上新与节假日补货',     how: '评估香港与本地物流合作伙伴',           when: '本月完成评估' },
      { title: '可持续材质与培育钻石试点', goal: '对接 ESG 与年轻消费叙事',       how: '选取 3 个 SKU 进行可持续材质试销',     when: '本月启动' },
    ],
    refs: [
      { icon: 'feed',  text: '情报中心: TikTok Old Money 风格走热' },
      { icon: 'feed',  text: '情报中心: 培育钻石价格下行' },
      { icon: 'alert', text: '风险提示: 新品 SKU 库存压力' },
    ],
  },
  {
    id: 'chn', name: '渠道部', sub: 'Channel', icon: 'store', priority: 'mid',
    cycle: '本月', owner: '渠道负责人 / 区域 BD',
    summary: [
      { text: '东南亚电商合作拓展', when: '本月' },
      { text: '头部零售商合作优化', when: '本月' },
      { text: '线下门店陈列优化',   when: '本月' },
      { text: '经销商赋能培训',     when: '持续' },
    ],
    goal: '巩固现有渠道，拓展东南亚线上线下机会',
    steps: [
      { title: '拓展东南亚头部电商合作', goal: '覆盖新马泰核心电商平台',     how: '对接 Shopee、Lazada 珠宝品类负责人', when: '本月完成签约' },
      { title: '升级头部商场陈列与橱窗', goal: '提升门店转化与品牌感知',     how: '联合视觉团队制定 Q3 陈列方案',       when: '本月完成方案' },
      { title: '建立经销商赋能培训体系', goal: '提升经销商高端 SKU 转化',     how: '推出月度产品 + 销售技巧培训',         when: '持续执行' },
      { title: '评估新增门店选址',       goal: '西部裕廊东高潜区域试点',     how: '完成市场调研与租金谈判',             when: '本季度完成评估' },
    ],
    refs: [
      { icon: 'map',   text: '地图洞察: 裕廊东竞品密度低、人口增长' },
      { icon: 'feed',  text: '情报中心: 亚马逊新加坡站珠宝品类增长' },
      { icon: 'alert', text: '风险提示: 商场租金谈判压力上升' },
    ],
  },
  {
    id: 'brd', name: '品牌部', sub: 'Brand', icon: 'crown', priority: 'mid',
    cycle: '本月', owner: '品牌负责人 / 内容主管',
    summary: [
      { text: '高端品牌故事传播',     when: '本月' },
      { text: '媒体与 KOL 合作放大', when: '本月' },
      { text: '区域化内容营销矩阵',   when: '持续' },
      { text: '婚庆品牌故事系列',     when: '本月' },
    ],
    goal: '在亚太核心市场建立差异化品牌叙事，强化高端定位',
    steps: [
      { title: '推出「东南亚高端工艺」品牌故事', goal: '强化品牌东方高端定位', how: '拍摄 3 支品牌纪录短片',             when: '本月完成脚本' },
      { title: '整合区域化媒体投放矩阵',         goal: '覆盖高端生活方式媒体', how: 'Vogue / Tatler / Lifestyle 投放联动', when: '本月启动' },
      { title: '策划婚庆品牌系列内容',           goal: '占领婚庆决策窗口期',   how: '联合婚庆策划公司联合内容投放',     when: '本季度执行' },
      { title: '建立本地 KOC 内容池',             goal: '持续供给真实场景内容', how: '组建 30 位本地 KOC 长期合作池',     when: '持续执行' },
    ],
    refs: [
      { icon: 'feed',   text: '情报中心: Old Money / 复古金饰内容热度' },
      { icon: 'map',    text: '地图洞察: 婚庆场景集中于乌节路 / 裕廊东' },
      { icon: 'alert',  text: '风险提示: 内容投放 ROI 持续监测' },
    ],
  },
  {
    id: 'law', name: '法务合规', sub: 'Legal', icon: 'scale', priority: 'low',
    cycle: '持续', owner: '合规负责人 / 法务',
    summary: [
      { text: '进口法规跟踪',           when: '持续' },
      { text: '数据合规与隐私管理',     when: '持续' },
      { text: '反洗钱与贸易合规审查',   when: '本月' },
      { text: '供应链尽职调查',         when: '本月' },
    ],
    goal: '保障跨境业务合规，前置识别监管与供应链合规风险',
    steps: [
      { title: '建立欧盟新规合规跟踪机制',   goal: '对应黄金供应链尽职调查指令',   how: '组建合规跟踪小组、每月输出风险报告', when: '本月启动' },
      { title: '更新数据合规与隐私管理体系', goal: '适配新加坡 PDPA 与欧盟 GDPR', how: '更新隐私政策、上线 Cookie 同意框',  when: '本月完成' },
      { title: '完成反洗钱与贸易合规审查',   goal: '对照新加坡 MAS 反洗钱要求',   how: '重新评估 KYC 与合规流程',           when: '本月完成' },
      { title: '建立供应链尽职调查档案',     goal: '覆盖核心钻石与黄金供应商',     how: '对 30 家核心供应商完成尽调档案',     when: '本季度执行' },
    ],
    refs: [
      { icon: 'feed',   text: '情报中心: 欧盟黄金供应链尽职调查新规' },
      { icon: 'alert',  text: '风险提示: 跨境贸易合规成本上升' },
      { icon: 'shield', text: '内部审计: 数据合规存在改进空间' },
    ],
  },
]
