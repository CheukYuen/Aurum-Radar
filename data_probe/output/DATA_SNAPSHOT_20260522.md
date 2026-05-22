# Aurum Radar — 数据快照

**抓取时间：** 2026-05-22  
**总记录数：** 147 条  Success 147 / Failed 0  
**正文状态：** 新闻/商场标题已拉取（60+66 条）；本次 DDG 限速，正文通过 WebFetch 单独获取（竞品系列、法规、部分新闻已记录在下方）

---

## 一、市场数据（实时）

**抓取方式：** urllib + Yahoo Finance JSON API（Googlebot UA）  
**抓取时间：** 2026-05-22 UTC

| 品种 | Symbol | 实时价格 | 单位 |
|---|---|---|---|
| **黄金期货** | GC=F | **4,529.10** | USD / troy oz |
| USD/SGD | USDSGD=X | **1.2787** | SGD per 1 USD |
| USD/CNY | USDCNY=X | **6.7978** | CNY per 1 USD |
| USD/HKD | USDHKD=X | **7.8355** | HKD per 1 USD |

**本地货币折算（1 troy oz 黄金）：**
- SGD：4,529 × 1.2787 = **约 SGD 5,791**
- CNY：4,529 × 6.7978 = **约 CNY 30,796**
- HKD：4,529 × 7.8355 = **约 HKD 35,499**

**历史参考：** 2024 年初约 $2,000/oz → 2026-05 已突破 $4,500/oz，涨幅超 125%。

---

## 二、新闻（60 条标题）

**抓取方式：** feedparser → Google News RSS × 3 关键词  
**正文获取：** 本次 DDG 限速，正文见下方「重点文章正文」  
**RSS 入口：**
- `gold+jewellery+Singapore`（20 条）
- `luxury+jewelry+Singapore`（20 条）  
- `gold+price+Singapore+jeweller`（20 条）

### 金价与市场趋势

| 日期 | 标题 | 来源 |
|---|---|---|
| 2025-01-05 | Soaring gold prices push Singapore buyers towards bars and coins over jewellery | CNA |
| 2026-04-29 | Demand for gold bars, coins in Singapore hits record high in Q1 2026 | The Straits Times |
| 2026-01-29 | Singapore investor demand for gold up 48% to 9.6 tonnes as WGC confirms record 2025 | Yahoo Finance SG |
| 2026-01-29 | Gold demand in Singapore jumps 48% to record 9.6 tonnes in 2025 | The Business Times |
| 2026-01-29 | Singapore investor demand for gold hits record high in 2025 | The Straits Times |
| 2026-05-17 | Singapore gold sellers bring in more stock, build vaults amid Mid-East crisis | The Straits Times |
| 2025-11-23 | 'Why didn't I buy more?': Soaring gold prices draw crowds of buyers, sellers to KL jewellers | The Straits Times |
| 2025-07-31 | Singapore gold investment soars 37% to 2.2 tonnes in Q2 while jewellery demand wanes | The Straits Times / BT |
| 2026-05-18 | Singapore's gold retailers boost inventories amid rising demand, global uncertainties | Vietnam+ |
| 2026-05-17 | Gold rush hits Singapore as jewellers, pawnshops and young investors queue up | Malay Mail |
| 2025-01-06 | Bullion beats bling: Gold buyers in Singapore trade in jewellery for bars | Malay Mail |
| 2025-01-04 | Singapore jewellers pivot to bullion as buyers shun pricey ornaments | Yahoo News Malaysia |
| 2025-11-02 | Gold's wild rally traps jewelers between soaring costs and cautious customers | Business Insider |
| 2025-07-30 | High gold prices 'a nightmare': French luxury jeweller Boucheron's CEO on the impact | The Business Times |
| 2026-02-13 | Singaporeans flock to gold despite record-high prices ahead of Chinese New Year | The Business Times |
| 2026-02-08 | Gold Prices Are Soaring—These Are The Gold Jewellery You Should Invest In Now | Harper's Bazaar SG |
| 2025-01-06 | Soaring gold prices push Singapore buyers towards bars and coins over jewellery | VnExpress |
| 2025-08-14 | 'Timeless and everlasting': More young people going for gold jewellery | Stomp |
| 2025-01-29 | Gold digging, pawning and jewellery retail lift off with gold | The Edge Singapore |
| 2026-05-20 | [Big read] Not just money: Gold carries the weight of memories | ThinkChina |

### 本地珠宝品牌

| 日期 | 标题 | 来源 |
|---|---|---|
| 2026-05-13 | Singapore jeweller Ishtara eyes overseas expansion, greater online presence amid gold price rally | The Business Times |
| 2026-04-02 | Risis turns 50: How the Singapore heritage jewellery brand is evolving for a new generation | CNA Luxury |
| 2026-01-30 | Why indie fine jewellery is on the rise in Singapore – plus 4 local brands to know | CNA Lifestyle |
| 2025-10-30 | Singapore bag brand Aupen launches its first jewellery line in partnership with LVMH | The Business Times |
| 2025-07-31 | How a three-year-old inspired Singaporean fine jewellery label State Property's 10th anniversary | CNA Luxury |
| 2025-08-06 | Celebrating SG60: Special-edition watches, jewellery and other accessories | CNA Luxury |
| 2025-05-27 | Shhh-ic: Mastering Quiet Luxury With Fine Jewellery | Grazia Singapore |
| 2025-08-05 | 5 Up-And-Coming Jewellery Brands to Watch | Grazia Singapore |
| 2025-08-05 | Singapore, Styled: The Best Local Jewellery Brands To Shop In Singapore | Grazia Singapore |
| 2025-02-19 | Local treasures: 19 Singaporean jewellery brands to know | Tatler Asia |
| 2025-08-08 | 16 Stylish And Affordable Jewellery Brands From Singapore | Harper's Bazaar SG |
| 2025-01-15 | 19 Affordable Jewellery Brands In Singapore For Stylish Costume Jewellery | Sassy Mama Singapore |
| 2026-05-15 | The Latest And Most Talked About Jewellery Collections | Harper's Bazaar SG |
| 2025-07-16 | A Guide To Shopping Vintage Watches & Jewellery in Singapore | FZINE Singapore |
| 2025-11-13 | A Gold Market jewellery exhibition is now on at Dover Street Market | Vogue Singapore |
| 2025-01-27 | Jade's global revival: From Asian symbol to modern luxury | prestigeonline.com |
| 2025-10-29 | Singapore luxury bag brand Aupen to launch jewelry collection with LVMH | VnExpress |
| 2025-01-27 | The Van Cleef & Arpels Zodiaque is the one fine jewellery piece worth investing in | PEAK Singapore |
| 2025-12-11 | Level up your look with some new jewellery | Honeycombers |
| 2026-02-09 | Where to find amazing jewellery in Singapore | expatliving.sg |

### 监管 & 展会

| 日期 | 标题 | 来源 |
|---|---|---|
| 2025-12-01 | Woman tried to exit Changi Airport arrival hall without declaring luxury bag | Mothership |
| 2025-06-10 | All that glitters: Singapore International Jewelry Expo bets on keen luxury spending | The Straits Times |
| 2025-08-12 | Luxury items seized in $3b money laundering case handed over to Deloitte | The Straits Times |
| 2025-11-23 | 7 Best Jewellery Repair Stores In Singapore To Polish And Restore Your Treasured Pieces | Harper's Bazaar SG |

---

## 三、竞品（WebFetch 直接抓取）

### Cartier — 新加坡站系列（2026-05-22）

**抓取方式：** WebFetch，目录页 + 具体系列子页面

#### 核心系列目录

**高珠系列（High Jewellery）：**
- En Équilibre、Nature Sauvage、Indomptables de Cartier、Coussin de Cartier、Cartier Libre

**经典常规系列：**
- LOVE、Trinity、Juste Un Clou、Clash de Cartier、Panthère de Cartier
- Cartier d'Amour、Maillon Panthère、C de Cartier、Écrou de Cartier、Grain de café

**定制类：**
- Engagement Rings（Solitaire 1895、Destinée、Etincelle）、Wedding Bands

#### Nature Sauvage 系列（详情）

**设计理念：** "通过新的、意想不到的相遇，揭示 Cartier 动物世界的新视角"，融合具象与抽象，探索材质对比与体积掌控。

**核心宝石规格：**

| 宝石 | 克拉数 | 产地 |
|---|---|---|
| 蓝宝石 | 26.53 ct | 斯里兰卡（Ceylon）|
| 红宝石碧玺（Rubellite）| 71.90 ct + 6.25 ct | — |
| 祖母绿 | 8.63 ct | 赞比亚（Zambian）|
| 蓝水晶（Aquamarine）| 38.50 ct | — |
| 哥伦比亚祖母绿 | 14.72 ct（合计）| 哥伦比亚 |

**代表单品：**
- **Panthère Canopée**：美洲豹趴伏于 26.53 克拉蓝宝石之上，置身想象中的丛林
- **Mochelys**：抽象项链内藏海龟，含 71.90 克拉红宝石碧玺，可变换为胸针
- **Celestun**：火烈鸟与祖母绿芦苇，搭配 38.50 克拉海蓝宝石
- **Amphista**：双蛇交缠，钻石鳞片，总计 14.72 克拉哥伦比亚祖母绿

---

### Chow Tai Fook — 主要系列（2026-05-22）

**抓取方式：** WebFetch，各系列子页面

| 系列 | 产品数 | 价格区间（HKD）| 主要材质 | 设计主题 |
|---|---|---|---|---|
| **HUÁ（华）** | 182 件 | $11,900 – $77,800+ | 999 纯金、18K 金、钻石 | 当代奢华生活，含 Han Meilin 联名子系列 |
| **Palace Museum（故宫）** | 131 件 | $2,800 – $47,800 | 999 纯金、钻石、翡翠、珍珠 | 中国宫廷文化，蝴蝶等传统纹样 |
| **JOIE** | 51 件（含更多）| $7,280 – $89,800 | 999 纯金、18K 金、钻石、蓝宝石 | 精致典雅，含经典与当代几何风格 |
| **DAWN** | 31 件 | $8,300 – $137,000 | 999 纯金、钻石 | 精工制作，高端日常及特殊场合 |

> **注：** Chow Tai Fook 电商站为香港站（en-hk），价格为港币。新加坡门店定价另行参考。

---

## 四、平台政策（Shopee）

**抓取方式：** urllib 直接抓取 help.shopee.sg 静态页面，全部 4 页成功

### 禁售与限制商品（77151）

核心条款：
- **贵金属/宝石**：含贵金属、受管制元素、宝石的商品（包含相关产品）须持有适用法律规定的相关注册/许可，否则违规
- **翡翠原石欺诈**：明确禁止翡翠原石欺诈行为
- **盲盒/抽奖销售**：含博彩性质的盲盒模式禁止
- **野生动物制品**：象牙、虎牙等动物来源饰品禁止
- **仿制品**：品牌珠宝仿品禁止

违规后果：下架 → 账号限制 → 账号暂停/终止 → 法律行动

### 禁售商品清单（77211）

与珠宝/美容跨界相关的处方药清单（节选）：Adapalene、Tretinoin、Hyaluronic dermal filler、Juvederm、Profhilo 等

### 广告政策（77154）

- 禁止内容：毒品、网络钓鱼、传销、色情、极端暴力、仇恨言论、恶意软件
- Landing Page 必须与提交素材实质一致
- 不得用机器人刷点击/印象
- 取消广告需提前 3 个工作日书面申请

### 联盟佣金结构（191914，2026-01-02 起生效）

| 渠道 | 身份 | 佣金 |
|---|---|---|
| Shopee Live | Top KOL | **10%**（无上限）|
| Social Media | Top KOL | **7%**（无上限）|
| Social Media | KOL/KOC | 6%（上限 $5/单）|
| Shopee Video | Top KOL | 5% |
| 品牌 Direct CommissionsXtra | 全部 | **最高 40%（无上限）**|
| 品牌 Indirect CommissionsXtra | 全部 | **最高 12%（无上限，新增）**|

**总计最高 50%（平台 10% + 品牌 40%）**

---

## 五、法规（Singapore Customs）

**抓取方式：** WebFetch  
**入口：** `customs.gov.sg/businesses/importing-goods/controlled-and-prohibited-goods-for-import`

### 受控商品
需向主管当局（Competent Authority）申请提前通知/许可证/证书。具体是否受控需通过 **HS/CA 产品代码查询工具** 核实。

### 禁止进口商品（明确列出）

| 主管部门 | 禁止品类 |
|---|---|
| Singapore Customs | 口香糖（医疗用途除外）|
| National Parks Board | 犀牛角、濒危野生动物及制品 |
| IMDA | 扫描接收器、军事通信设备、干扰器、色情及煽动性内容 |
| Health Sciences Authority（烟草）| 电子烟、水烟、无烟烟草 |
| Health Sciences Authority（药品）| 受管制毒品（第四附表）|

> **贵金属/珠宝进口：** 页面无具体规定，需人工使用 HS/CA 查询工具确认许可证要求。

---

## 六、商场活动（66 条标题）

**抓取方式：** feedparser → Google News RSS × 3 商场  
**条目数：** Marina Bay Sands 20 + ION Orchard 20（+6 直链）+ Paragon 20

### Marina Bay Sands（近期重点）

| 日期 | 标题 | 来源 |
|---|---|---|
| 2026-05-22 | Pursuit of Jade's Tian Xiwei in Singapore on May 22 for brand event | AsiaOne |
| 2026-05-21 | Woh Hup appointed to lead construction of new Marina Bay Sands development | The Business Times |
| 2026-05-16 | AP x Swatch Royal Pop launch: Long queues at Ion Orchard and Marina Bay Sands | CNA Lifestyle |
| 2026-05-15 | Long queues at Ion Orchard and MBS ahead of Audemars Piguet x Swatch Royal Pop | The Straits Times |
| 2026-05-21 | What Is With… overnight queues for the AP x Swatch launch | The Straits Times |
| 2026-07-16 | Sands Breaks Ground on New Ultra-Luxury Development in Singapore | Las Vegas Sands |
| 2026-04-19 | New Sands landmark rising next to Marina Bay Sands | Meetings & Conventions Asia |
| 2025-12-25 | Inside Marina Bay Sands' modern vision of artful, wellbeing-centric hospitality | BBC |
| 2026-02-20 | Marina Bay precinct partners UOB, MBS and STB with Disney Cruise Line for fireworks | STB |
| 2025-09-22 | Taste the thrill of race season at Marina Bay Sands | CNA Luxury |

### ION Orchard（近期重点）

| 日期 | 标题 | 来源 |
|---|---|---|
| 2026-05-15 | Long queues at Ion Orchard and MBS ahead of AP x Swatch Royal Pop launch | The Straits Times |
| 2026-05-16 | AP x Swatch Royal Pop launch: Long queues at Ion Orchard and Marina Bay Sands | CNA Lifestyle |
| 2026-05-17 | Shop For Summer Staples At Loro Piana's Resort 2026 Pop-Up At ION Orchard | AugustMan Singapore |
| 2025-12-20 | Piaget opens its new flagship boutique in Singapore | Richemont |
| 2025-11-18 | Piaget's New ION Orchard Flagship Is All About Radiance | Grazia Singapore |
| 2026-01-21 | Luxury shopping in Singapore gets a timely refresh with 10 new boutiques | PEAK Singapore |
| 2025-11-21 | Van Cleef & Arpels opens new duplex boutique at Ion Orchard with festive installation | CNA Luxury |
| 2025-12-12 | Van Cleef & Arpels Opens First Duplex Boutique in Southeast Asia at Ion Orchard | Grazia Singapore |
| 2025-09-24 | Tiffany opens temporary store in Ion Orchard while existing one gets major revamp | The Business Times |
| 2025-10-13 | Inside Chanel's new shoe boutique in Singapore and the Italian atelier behind it | CNA Luxury |
| 2026-02-02 | Vacheron Constantin reopens its ION Orchard boutique | Robb Report Singapore |
| 2026-02-12 | Fibonacci-inspired art catches the eye at IWC's ION Orchard boutique | The Business Times |

**ION Orchard 直链分类：**
- [What's On](https://www.ionorchard.com/en/events.html)
- [Watches and Jewellery](https://www.ionorchard.com/en/shop.html?category=Watches%20and%20Jewellery)
- [Fine Watches and Jewellery](https://www.ionorchard.com/en/shop.html?category=Fine%20Watches%20and%20Jewellery)
- [Luxury Fashion and Accessories](https://www.ionorchard.com/en/shop.html?category=Luxury%20Fashion%20and%20Accessories)

### Paragon（近期重点）

| 日期 | 标题 | 来源 |
|---|---|---|
| 2026-04-20 | Paragon's medical suites, Orchard Road location key factors in S$3.9 billion sale | CNA |
| 2026-04-20 | Singapore's Largest REIT Sells Office Tower to Buy Temasek's Luxury Mall Paragon | Bloomberg |
| 2026-04-20 | Paragon's journey from car showroom to S$3.9 billion jewel | The Business Times |
| 2026-04-09 | Paragon and Janice Wong unveil Singapore's largest chocolate art installation | The Straits Times |
| 2025-10-13 | Rolex "Time Zone to Time Zone" GMT-Master II Exhibition in Singapore | SJX Watches |
| 2025-09-25 | Paragon at 25: Redefining luxury through craft, story and discovery | CNA Luxury |
| 2025-12-23 | Bottega Veneta opens boutique in Paragon Singapore | prestigeonline.com |
| 2025-11-16 | Tatler Singapore and Paragon present a masterclass in craft at Maison Margiela's new boutique | Tatler Asia |
| 2025-08-01 | Bvlgari Marks SG60 With "Beyond Time" Exhibition | Revolution Watch |
| 2026-04-22 | Jil Sander opens its second Singapore boutique in Paragon | Robb Report Singapore |

---

## 七、重点文章正文（已验证可抓取）

以下为上次 DDG 成功时抓取的完整正文（存档于 `output/normalized/news_20260522T040730Z.json`）：

### CNA — 金价推动消费者从金饰转向金条

**URL：** https://www.channelnewsasia.com/singapore/gold-prices-singapore-consumers-bars-coins-jewellery-5800526  
**来源：** CNA | 2025-01-05 | 正文 4147 字

金饰零售商因金价高企承压，正通过重新设计轻量产品（<3g 项链/手链）和增加旧金回收来维持销售。2025 年全年金饰销量按量跌 8%，但同期金条/金币需求跳升 47%。消费者从「金饰消费」全面转向「金条投资」，GST 豁免是重要驱动因素。

### The Straits Times — Q1 2026 金条/金币需求历史新高

**URL：** https://www.straitstimes.com/business/companies-markets/demand-for-gold-bars-coins-in-singapore-hits-record-high-in-q1-2026  
**来源：** The Straits Times | 2026-04-29 | 正文 3794 字

Q1 2026 新加坡金条/金币需求同比 +42% 至 3.5 吨，历史新高。金饰需求同期 -13%（1.5 吨）。金价从 $2,600 涨至最高 $5,589/oz。MAS 目前持有黄金 193,761 kg。WGC 预计地缘政治风险溢价将持续。

---

## 八、数据源健康状态（本次运行）

| 数据源 | 条目数 | 状态 | 备注 |
|---|---|---|---|
| Google News RSS × 3（新闻）| 60 | ✅ | 全部标题成功；正文因 DDG 限速为 0 |
| Cartier 系列页 | 2 页 | ✅ | WebFetch；En Équilibre 连接超时，获取 Nature Sauvage |
| Chow Tai Fook 系列页 | 4 系列 | ✅ | WebFetch；HUÁ/Palace/JOIE/DAWN |
| Shopee Help Center | 4 页 | ✅ | urllib；全部成功 |
| Singapore Customs | 1 页 | ✅ | WebFetch；无贵金属细节 |
| Yahoo Finance | 4 条 | ✅ | urllib + Googlebot UA；全部成功 |
| Google News RSS × 3（商场）| 66 | ✅ | 全部标题成功；正文因 DDG 限速为 0 |
| Tiffany | — | ❌ | 全面 403，已从配置移除 |
| MAS 贵金属监管 | — | ❌ | 404，已从配置移除 |
| ION Orchard Events 页 | — | ❌ | JS 渲染，已从配置移除 |
