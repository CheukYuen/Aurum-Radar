# Aurum Radar — Crawl Snapshot 20260523

Generated: 2026-05-23T03:27:05.860021+00:00

- JSONL files: **6**
- Legacy JSON files (SG MVP probes): **23**
- Raw HTML snapshots (parse_failed): **1**

---

## Per-source overview

| source_id | type | total | success | failed | markets |
|---|---|---|---|---|---|
| `ecommerce_announcements` | ecommerce | 4 | 2 | 2 | GLOBAL, SG, US |
| `federal_register` | regulation | 135 | 135 | 0 | US |
| `gdelt_doc` | news | 120 | 101 | 19 | ID, JP, KR, MY, PH, SG, TH, US, VN |
| `google_news_rss` | news | 654 | 654 | 0 | ID, JP, KR, MY, PH, SG, TH, US, VN |
| `reddit` | social | 383 | 383 | 0 | GLOBAL |
| `tavily` | news | 146 | 146 | 0 | ID, JP, MY, PH, SG, TH, VN |

**Grand total**: 1442 records, 21 failed placeholders.

---

## ecommerce_announcements  (4 records)

**By market**: SG=2, GLOBAL=1, US=1

**By signal_type**: platform_policy=4

### Samples

#### Market SG  (1 records)

- **[parse_failed] Lazada Open Platform**
  - url: https://open.lazada.com/apps/doc/doc?nodeId=10557&docId=108253
  - summary: raw snapshot saved to output/raw/lazada_open_platform_20260523T023307Z.html

#### Market US  (1 records)

- **Create your Amazon account**
  - url: https://sellercentral.amazon.com/ap/register?openid.pape.max_auth_age=300&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&webAuthnChallengeIdForAutofill=GNuNsaL85_GQLsFvxzrF3lzIq2eR1pXJ%3ANA&webAuthnGetParametersForAutofill=eyJycElkIjoiYW1hem9uLmNvbSIsImNoYWxsZW5nZSI6IkdOdU5zYUw4NV9HUUxzRnZ4enJGM2x6SXEyZVIxcFhKIiwidGltZW91dCI6OTAwMDAwLCJtZWRpYXRpb24iOiJjb25kaXRpb25hbCIsInVzZXJWZXJpZmljYXRpb24iOiJwcmVmZXJyZWQifQ%3D%3D&language=en_US&pageId=sc_amazon_v3_unified&openid.pape.preferred_auth_policies=Policy15&openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2Fhelp%2Fhub%2Fannouncements&prevRID=QG5VFJ2VJFZVVKJPRVXA&openid.assoc_handle=sc_na_amazon_v2&openid.mode=checkid_setup&intercept=false&prepopulatedLoginId=&failedSignInCount=0&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0

### Failed queries

- [failed] Shopify Changelog — feedparser bozo: text/html; charset=utf-8 is not an XML media type
- [failed] Shopee Open Platform Announcements — timeout

---

## federal_register  (135 records)

**By market**: US=135

**By signal_type**: regulation=135

### Samples

#### Market US  (135 records)

- **Initiation of Antidumping and Countervailing Duty Administrative Reviews**
  - url: https://www.federalregister.gov/documents/2026/05/04/2026-08639/initiation-of-antidumping-and-countervailing-duty-administrative-reviews
  - published_at: 2026-05-04
  - author/agency: Commerce Department, International Trade Administration
  - summary: The U.S. Department of Commerce (Commerce) has received requests to conduct administrative reviews of various antidumping duty (AD) and countervailing duty (CVD) orders with March anniversary dates. In accordance with Commerce's regulations, we are initiating those administrative reviews.

- **Agency Information Collection Activities; Submission for OMB Review; Comment Request; Proposed New Information Collection; Survey of the Costs of AML/CFT Compli**
  - url: https://www.federalregister.gov/documents/2026/04/28/2026-08242/agency-information-collection-activities-submission-for-omb-review-comment-request-proposed-new
  - published_at: 2026-04-28
  - author/agency: Treasury Department
  - summary: The Department of the Treasury (Treasury) will submit the following information collection request to the Office of Management and Budget (OMB) for review and clearance in accordance with the Paperwork Reduction Act of 1995 (PRA), on or after the date of publication of this notice. The public is inv

- **Notice of OFAC Sanctions Action**
  - url: https://www.federalregister.gov/documents/2026/04/21/2026-07699/notice-of-ofac-sanctions-action
  - published_at: 2026-04-21
  - author/agency: Treasury Department, Foreign Assets Control Office
  - summary: The U.S. Department of the Treasury's Office of Foreign Assets Control (OFAC) is publishing the names of one or more persons that have been placed on OFAC's Specially Designated Nationals and Blocked Persons List (SDN List) based on OFAC's determination that one or more applicable legal criteria wer

---

## gdelt_doc  (120 records)

**By market**: SG=53, KR=51, JP=3, US=3, TH=2, MY=2, VN=2, ID=2, PH=2

**By signal_type**: macro=101, competition=19

### Samples

#### Market KR  (49 records)

- **  미국 젠지 스타일 … 서인영의 LA 언니 룩 [ 누구템 ] **
  - url: https://www.edaily.co.kr/News/Read?newsId=01892566645451872&mediaCodeNo=257
  - published_at: 20260522T234500Z
  - author/agency: edaily.co.kr

- **为什么有的商场调改  越改越死 ？- 虎嗅网**
  - url: https://www.huxiu.com/article/4860578.html
  - published_at: 20260522T213000Z
  - author/agency: huxiu.com

- **The Star of Richemont Strong Fiscal Year : Jewelry**
  - url: https://www.jckonline.com/editorial-article/richemont-fiscal-year/
  - published_at: 20260522T183000Z
  - author/agency: jckonline.com

#### Market SG  (52 records)

- **WFDB Adds Botswana and Angola as Nation Affiliated Members Ahead of 41st World Diamond Congress**
  - url: https://www.diamondworld.net/news/wfdb-adds-botswana-and-angola-as-nation-affiliated-members-ahead-of-41st-world-diamond-congress
  - published_at: 20260522T134500Z
  - author/agency: diamondworld.net

- **沂蒙山区迈向  买全球卖全球  开放路 - 全景山东 山东新闻**
  - url: http://sd.sdnews.com.cn/sdgd/202605/t20260522_4681842.htm
  - published_at: 20260522T080000Z
  - author/agency: sd.sdnews.com.cn

- **หวั่นตกขบวน ไทยเร่งเจรจาFTA หลัง EU เดินสายปิดดีลทั่วโลก**
  - url: https://www.thaipbs.or.th/news/content/506133
  - published_at: 20260520T054500Z
  - author/agency: thaipbs.or.th

### Failed queries

- [failed query] jewelry market Japan — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- [failed query] luxury jewelry Japan — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- [failed query] gold jewelry Japan — HTTP Error 429: Too Many Requests
- [failed query] jewelry market Korea — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- [failed query] lab grown diamond Korea — HTTP Error 429: Too Many Requests
- [failed query] luxury jewelry Singapore — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- [failed query] jewelry market Thailand — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- [failed query] gold jewelry Thailand — <urlopen error _ssl.c:1112: The handshake operation timed out>
- [failed query] jewelry market Malaysia — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- [failed query] gold jewelry Malaysia — <urlopen error EOF occurred in violation of protocol (_ssl.c:1129)>
- ... and 9 more

---

## google_news_rss  (654 records)

**By market**: KR=75, SG=75, VN=75, ID=74, PH=74, US=74, TH=73, MY=72, JP=62

**By signal_type**: consumer_behavior=650, competition=4

**Brand hits**: Pandora=2, Bvlgari=1, Chow Tai Fook=1

**Product hits**: gold jewelry=1, diamond jewelry=1

### Samples

#### Market ID  (74 records)

- **Gold Giant Hartadinata (HRTA) Eyes $4.4B Revenue Target as Bullion Bank Strategy Pays Off - InvestorTrust**
  - url: https://news.google.com/rss/articles/CBMizwFBVV95cUxPVWp6eG5kVUkzRDE0dV9PaTl4a2sxdzdtRmpxRU51Y0JpekJDMzFPR285MmJZZHhGRkdWLUpxT1ZrMjRSc2tmQlctcThWbDc0M3FHNXMwODY2QU9lcFBEZ1N2dXZkam9XYzdSQWs4RkRZMEJnZmFEdkNoUWtaekJmYWJRd0FCZGVBcnEtdWNRY1huQVkzVWZpNjJ6OVFOOVVkaGFXVElSQmEyMEZwbkFkMEtqRnpNdnlsV2t6aTRHOFhWTlRSYk5YNEl1RXdiM0U?oc=5
  - published_at: Wed, 08 Apr 2026 02:52:11 GMT
  - author/agency: InvestorTrust
  - summary: <a href="https://news.google.com/rss/articles/CBMizwFBVV95cUxPVWp6eG5kVUkzRDE0dV9PaTl4a2sxdzdtRmpxRU51Y0JpekJDMzFPR285MmJZZHhGRkdWLUpxT1ZrMjRSc2tmQlctcThWbDc0M3FHNXMwODY2QU9lcFBEZ1N2dXZkam9XYzdSQWs4RkRZMEJnZmFEdkNoUWtaekJmYWJRd0FCZGVBcnEtdWNRY1huQVkzVWZpNjJ6OVFOOVVkaGFXVElSQmEyMEZwbkFkMEtqRnpNdnlsV2

- **Will Gold Prices Still Be High in 2026? - Kompas.id**
  - url: https://news.google.com/rss/articles/CBMihAFBVV95cUxNek40ZXlDR01Uc3V5enN5QmhJUE9HNHlaZXlKV054dDZPSzFDNmdXVDlZNWQ1WnJRMGJ3ay1vRDRlS0RTMHl5V1ZIeGNJUi1vdHlWLXF0cGN5YTFlbHB0V3Q0T3ZPUnRZZ0RrTmx0bWJUd3I1cWRuZy1CT01zWEhVVmppNGE?oc=5
  - published_at: Tue, 10 Feb 2026 08:00:00 GMT
  - author/agency: Kompas.id
  - summary: <a href="https://news.google.com/rss/articles/CBMihAFBVV95cUxNek40ZXlDR01Uc3V5enN5QmhJUE9HNHlaZXlKV054dDZPSzFDNmdXVDlZNWQ1WnJRMGJ3ay1vRDRlS0RTMHl5V1ZIeGNJUi1vdHlWLXF0cGN5YTFlbHB0V3Q0T3ZPUnRZZ0RrTmx0bWJUd3I1cWRuZy1CT01zWEhVVmppNGE?oc=5" target="_blank">Will Gold Prices Still Be High in 2026?</a>&nbsp

- **Indonesia’s Jewelry Exports Jump 65%, Reach $9.1 Billion in 2025 - RRI.co.id**
  - url: https://news.google.com/rss/articles/CBMingFBVV95cUxPT29uODNCVnZkLU91RTJvd042UDdfQWFva09GOVJGN2YwbmFxOEZ4a05fVW5LMVhWa3B2ak1TOXlQZ2drU1N3eDVlc2M5cnlJZ29LbHJmdXRzb0hvNV85Ym8xVncyejR6WnNHTG9ndDl2LWdPZURHY3ZZWkEwTi1iVDBfVzU1WUFTbGVLenFSTVdZNGI3WS1ocjA2Q2tLZw?oc=5
  - published_at: Tue, 10 Mar 2026 07:00:00 GMT
  - author/agency: RRI.co.id
  - summary: <a href="https://news.google.com/rss/articles/CBMingFBVV95cUxPT29uODNCVnZkLU91RTJvd042UDdfQWFva09GOVJGN2YwbmFxOEZ4a05fVW5LMVhWa3B2ak1TOXlQZ2drU1N3eDVlc2M5cnlJZ29LbHJmdXRzb0hvNV85Ym8xVncyejR6WnNHTG9ndDl2LWdPZURHY3ZZWkEwTi1iVDBfVzU1WUFTbGVLenFSTVdZNGI3WS1ocjA2Q2tLZw?oc=5" target="_blank">Indonesia’s J

#### Market JP  (62 records)

- **ジュエリーの日本市場（2026年～2034年）、市場規模（ネックレス、指輪、イヤリング）・分析レポートを発表 - Newscast.jp**
  - url: https://news.google.com/rss/articles/CBMiT0FVX3lxTE95dkZ6NmpkbzZ1R2NCS3FicC0yLXF3SjZrWmktVDBCQUZjOXZmcWNfekxPMVp2ZXZ5SGhfcGxLZzVmZ2FXNHJZVGJ6MGttT2c?oc=5
  - published_at: Fri, 27 Mar 2026 07:00:00 GMT
  - author/agency: Newscast.jp
  - summary: <a href="https://news.google.com/rss/articles/CBMiT0FVX3lxTE95dkZ6NmpkbzZ1R2NCS3FicC0yLXF3SjZrWmktVDBCQUZjOXZmcWNfekxPMVp2ZXZ5SGhfcGxLZzVmZ2FXNHJZVGJ6MGttT2c?oc=5" target="_blank">ジュエリーの日本市場（2026年～2034年）、市場規模（ネックレス、指輪、イヤリング）・分析レポートを発表</a>&nbsp;&nbsp;<font color="#6f6f6f">Newscast.jp</font>

- **日本のジュエリー市場の規模、シェアレポート、成長要因および予測分析（2025年～2035年） - ドリームニュース**
  - url: https://news.google.com/rss/articles/CBMiU0FVX3lxTE82VkV0azBEVnF4endqQWZ3ck1tbFliYll4a0FZN0NYT1NqNGNOY094UUhtSFJsd0dmekxqV3FlQVBBWW04LVFyaFpHSEFQbVliQ2pz?oc=5
  - published_at: Mon, 30 Mar 2026 07:00:00 GMT
  - author/agency: ドリームニュース
  - summary: <a href="https://news.google.com/rss/articles/CBMiU0FVX3lxTE82VkV0azBEVnF4endqQWZ3ck1tbFliYll4a0FZN0NYT1NqNGNOY094UUhtSFJsd0dmekxqV3FlQVBBWW04LVFyaFpHSEFQbVliQ2pz?oc=5" target="_blank">日本のジュエリー市場の規模、シェアレポート、成長要因および予測分析（2025年～2035年）</a>&nbsp;&nbsp;<font color="#6f6f6f">ドリームニュース</font>

- **2035 年のシルバー ジュエリー市場の動向、成長、予測 - Business Research Insights**
  - url: https://news.google.com/rss/articles/CBMikAFBVV95cUxQUnd1RU01T1UxMTBodE5XOEhQWHU1T3laN0owOERUeXEwTWdoNS1DWlpGbnBpZVlxTzZrOThrZE50UnpOTS0zVmVodk10MUF0akFZM0pvT205NHVOa0tEQ3JKY2Mxak15b1VpWDdJVzFpMnNZdGtmVVZHUVhtUi13ZnJDUzliM2o3a2cwOEVPai0?oc=5
  - published_at: Mon, 13 Apr 2026 07:00:00 GMT
  - author/agency: Business Research Insights
  - summary: <a href="https://news.google.com/rss/articles/CBMikAFBVV95cUxQUnd1RU01T1UxMTBodE5XOEhQWHU1T3laN0owOERUeXEwTWdoNS1DWlpGbnBpZVlxTzZrOThrZE50UnpOTS0zVmVodk10MUF0akFZM0pvT205NHVOa0tEQ3JKY2Mxak15b1VpWDdJVzFpMnNZdGtmVVZHUVhtUi13ZnJDUzliM2o3a2cwOEVPai0?oc=5" target="_blank">2035 年のシルバー ジュエリー市場の動向、成長、予測</a>

#### Market KR  (75 records)

- **[한국인이 주목한 럭셔리 브랜드 30] JEWELRY TOP 10 - 포브스코리아**
  - url: https://news.google.com/rss/articles/CBMickFVX3lxTE9oZS1IUXBTYjZIeUoxQ2drU041SE53ZFlGWUR4cGhTUU4yTlRscEI5LUQzZUYwRnc5YTVDblFWd0dTLXFyZXpqOXVacWsybHVhcXpOY2dTZElSRFk1QlZJZndIYm8xY3R4dnc3cnF6QXBXdw?oc=5
  - published_at: Tue, 28 Apr 2026 07:00:00 GMT
  - author/agency: 포브스코리아
  - summary: <a href="https://news.google.com/rss/articles/CBMickFVX3lxTE9oZS1IUXBTYjZIeUoxQ2drU041SE53ZFlGWUR4cGhTUU4yTlRscEI5LUQzZUYwRnc5YTVDblFWd0dTLXFyZXpqOXVacWsybHVhcXpOY2dTZElSRFk1QlZJZndIYm8xY3R4dnc3cnF6QXBXdw?oc=5" target="_blank">[한국인이 주목한 럭셔리 브랜드 30] JEWELRY TOP 10</a>&nbsp;&nbsp;<font color="#6f6f6f"

- **‘개과천선’ 쥬얼리 멤버들, 서인영에 냉동난자 권유...“너 같은 딸 낳아봐야” - 일간스포츠**
  - url: https://news.google.com/rss/articles/CBMiW0FVX3lxTFBKUTdja0NTdXNBbGdRWjNCRFlQQW5YU1l5ZnpHcTNxU3dTZURxYUtHOVlYbzFtelFUUmF3UkY5cXhFYjc3NHNQUWJrcDRZQ2Vva2g1akdFbDBGalU?oc=5
  - published_at: Wed, 06 May 2026 11:41:00 GMT
  - author/agency: 일간스포츠
  - summary: <a href="https://news.google.com/rss/articles/CBMiW0FVX3lxTFBKUTdja0NTdXNBbGdRWjNCRFlQQW5YU1l5ZnpHcTNxU3dTZURxYUtHOVlYbzFtelFUUmF3UkY5cXhFYjc3NHNQUWJrcDRZQ2Vva2g1akdFbDBGalU?oc=5" target="_blank">‘개과천선’ 쥬얼리 멤버들, 서인영에 냉동난자 권유...“너 같은 딸 낳아봐야”</a>&nbsp;&nbsp;<font color="#6f6f6f">일간스포츠</font>

- **뜨거운 명품 시장…한국 찾는 글로벌 브랜드들 - MTN 머니투데이방송**
  - url: https://news.google.com/rss/articles/CBMiZEFVX3lxTE5wOUtOeFY1ejN6VDlrMDVlYUJFOFVNNXg1VlRoU0xhbnd1RWdZZkhhM2pIU1g2YWhXS2xCckFrNzhSNXV5b0tSWF9HdXBtd0VRNk5EOHZoa2VyMWFDVkl4djVEUWE?oc=5
  - published_at: Wed, 15 Apr 2026 07:00:00 GMT
  - author/agency: MTN 머니투데이방송
  - summary: <a href="https://news.google.com/rss/articles/CBMiZEFVX3lxTE5wOUtOeFY1ejN6VDlrMDVlYUJFOFVNNXg1VlRoU0xhbnd1RWdZZkhhM2pIU1g2YWhXS2xCckFrNzhSNXV5b0tSWF9HdXBtd0VRNk5EOHZoa2VyMWFDVkl4djVEUWE?oc=5" target="_blank">뜨거운 명품 시장…한국 찾는 글로벌 브랜드들</a>&nbsp;&nbsp;<font color="#6f6f6f">MTN 머니투데이방송</font>

#### Market MY  (72 records)

- **Malaysians buying more gold to hedge against economic and geopolitical risks - MySinchew**
  - url: https://news.google.com/rss/articles/CBMickFVX3lxTFBJVjhLMVRZZzF4TkRHYVUxLTg5UThFQzd3X09UQkFFNUhkYXlqUm9STW40elV4Ri1YNE8tWjBBYlI4cTBuNkZtNzdKNnRQRktNNzJycFEyY1dzdUtwenY0NkZRSmhXNlhTSU5BWFZKMGZRZw?oc=5
  - published_at: Sun, 15 Mar 2026 07:00:00 GMT
  - author/agency: MySinchew
  - summary: <a href="https://news.google.com/rss/articles/CBMickFVX3lxTFBJVjhLMVRZZzF4TkRHYVUxLTg5UThFQzd3X09UQkFFNUhkYXlqUm9STW40elV4Ri1YNE8tWjBBYlI4cTBuNkZtNzdKNnRQRktNNzJycFEyY1dzdUtwenY0NkZRSmhXNlhTSU5BWFZKMGZRZw?oc=5" target="_blank">Malaysians buying more gold to hedge against economic and geopolitical ri

- **Shining Bright Malaysia: The Glittering World of High-End Jewellery Industry - MIDA | Malaysian Investment Development Authority**
  - url: https://news.google.com/rss/articles/CBMiogFBVV95cUxPOGlYTDlHVVUwWmlqNDBFMFpVWWNhVXVjX2JRSnhyUHFjQlpCSmdrOGFaMS1MaVdMN0ltQV9DaWItZVBPYjc1VkNvc3V6eGw5VGlEaEMzVFJWdkZuRVQzaEFuSDZnc2w0MFFDS25zbEI1dWFpci1fY3NCU3h0RTYxZ2ZqSmtiUUt2QnFJVmthcmlsS0lROW44TDgySm5ySkFDN1E?oc=5
  - published_at: Fri, 30 Jun 2023 07:00:00 GMT
  - author/agency: MIDA | Malaysian Investment Development Authority
  - summary: <a href="https://news.google.com/rss/articles/CBMiogFBVV95cUxPOGlYTDlHVVUwWmlqNDBFMFpVWWNhVXVjX2JRSnhyUHFjQlpCSmdrOGFaMS1MaVdMN0ltQV9DaWItZVBPYjc1VkNvc3V6eGw5VGlEaEMzVFJWdkZuRVQzaEFuSDZnc2w0MFFDS25zbEI1dWFpci1fY3NCU3h0RTYxZ2ZqSmtiUUt2QnFJVmthcmlsS0lROW44TDgySm5ySkFDN1E?oc=5" target="_blank">Shining

- **Jewellery retailer Goldfinch plans ACE Market IPO - The Edge Malaysia**
  - url: https://news.google.com/rss/articles/CBMiUEFVX3lxTE1hcmJ5ckUxQkFycmd6TTBSWDhFeWVSNjl0OGo2NDRMaUYzaUZWRjhlMy05d2hDMUZjZTRFcTJNYTdFNUlEdHlRaHg4T2h0U09o?oc=5
  - published_at: Wed, 15 Oct 2025 07:00:00 GMT
  - author/agency: The Edge Malaysia
  - summary: <a href="https://news.google.com/rss/articles/CBMiUEFVX3lxTE1hcmJ5ckUxQkFycmd6TTBSWDhFeWVSNjl0OGo2NDRMaUYzaUZWRjhlMy05d2hDMUZjZTRFcTJNYTdFNUlEdHlRaHg4T2h0U09o?oc=5" target="_blank">Jewellery retailer Goldfinch plans ACE Market IPO</a>&nbsp;&nbsp;<font color="#6f6f6f">The Edge Malaysia</font>

#### Market PH  (74 records)

- **Boosting ‘Made in Philippines’ through heirloom jewelry preservation - Philstar.com**
  - url: https://news.google.com/rss/articles/CBMitwFBVV95cUxQWGUwQkdTdDhVbVBRRjdNVVJhMHU3Q3VzQ2JvU290eGt2eTkxczNCU2lyUDEtZEdzY0l0N0xRNjFGeS1xa09sSzFUeW1OU0xyenA0c1pMbFJFUnc5Q3pWTzA1RGlObkliTkQzY0MtRm1YZS10S3VZTjJjZ1B0VkFMLXNJQWFGNDMtdWVHUUVPNFRGb0RRbWpPb0drRmp0aWNxZXRxVVRCUnZoelExMnB3Q3p1VlF4aG_SAb4BQVVfeXFMT3FsN2ZvbFhKVWVfZktMTnRIUGN6clJILUoyQzZIUy1HVmJBb1llZGN3QW90b2F0Y1FSMzJRdlVVaWlCUmRaS0kxLWIyYjBDUGpNeVpYWWF4NmMxWGt4N3lwdC1qZTlWcURVdHR3SVBVSUNEOW54UXhGRkJPSFc2OGJzbUtmT0JtVFdjTFB1V255Smhtc3BUaE93dDVlSTRXeTBNdjlpa0RZeTlMbm5CSTZ5VkdaMTFyNXNVTWRRdw?oc=5
  - published_at: Sun, 26 Apr 2026 07:00:00 GMT
  - author/agency: Philstar.com
  - summary: <a href="https://news.google.com/rss/articles/CBMitwFBVV95cUxQWGUwQkdTdDhVbVBRRjdNVVJhMHU3Q3VzQ2JvU290eGt2eTkxczNCU2lyUDEtZEdzY0l0N0xRNjFGeS1xa09sSzFUeW1OU0xyenA0c1pMbFJFUnc5Q3pWTzA1RGlObkliTkQzY0MtRm1YZS10S3VZTjJjZ1B0VkFMLXNJQWFGNDMtdWVHUUVPNFRGb0RRbWpPb0drRmp0aWNxZXRxVVRCUnZoelExMnB3Q3p1VlF4aG_SAb

- **Monkayo advances local jewelry industry - Philippine Information Agency**
  - url: https://news.google.com/rss/articles/CBMickFVX3lxTE1ya09qUF91VEU3M2lXOUxicTR1VExaY1I4eGRJNDJMa1hnZy1rSk40OU9SRnhWTGZCY3FOcFpMek0wUVJsSk5mdUZBSVRqajZZbUlCM2dwTjFoQ1lTMGZTRWMyWVVrVktaVXIzU3B3ekpvZw?oc=5
  - published_at: Wed, 01 Oct 2025 07:00:00 GMT
  - author/agency: Philippine Information Agency
  - summary: <a href="https://news.google.com/rss/articles/CBMickFVX3lxTE1ya09qUF91VEU3M2lXOUxicTR1VExaY1I4eGRJNDJMa1hnZy1rSk40OU9SRnhWTGZCY3FOcFpMek0wUVJsSk5mdUZBSVRqajZZbUlCM2dwTjFoQ1lTMGZTRWMyWVVrVktaVXIzU3B3ekpvZw?oc=5" target="_blank">Monkayo advances local jewelry industry</a>&nbsp;&nbsp;<font color="#6f6f

- **Philippines Jewellery Market 2026: Heritage Craftsmanship, Digital Retail and Rising Aspirational Demand - vocal.media**
  - url: https://news.google.com/rss/articles/CBMiyAFBVV95cUxPX1FiYjEzVWNkZENiRm1obXgxODJBT3hLOFNCMzQ0eXotVHQ3by10Q1BBanNTRWtPWjVXSHRFNjRBeXVJMERmMlFUNTVBa2taREdyWkphcllrdmt1ZGZ4dFZMaW1zSERWeFYzM2Z3SDZqZnlrX3A2Zk1nOEdCUDVnaE85Rl9ZVVFJbkFyUjJ1YWk2NkUwNGFxMHVKYlB1Wk05R2lLVENmTGJnLXljanBjYm9ZT0d6WDA3R2diMWl6enIwbnlHaDNjVA?oc=5
  - published_at: Thu, 19 Feb 2026 07:30:52 GMT
  - author/agency: vocal.media
  - summary: <a href="https://news.google.com/rss/articles/CBMiyAFBVV95cUxPX1FiYjEzVWNkZENiRm1obXgxODJBT3hLOFNCMzQ0eXotVHQ3by10Q1BBanNTRWtPWjVXSHRFNjRBeXVJMERmMlFUNTVBa2taREdyWkphcllrdmt1ZGZ4dFZMaW1zSERWeFYzM2Z3SDZqZnlrX3A2Zk1nOEdCUDVnaE85Rl9ZVVFJbkFyUjJ1YWk2NkUwNGFxMHVKYlB1Wk05R2lLVENmTGJnLXljanBjYm9ZT0d6WDA3R2

#### Market SG  (75 records)

- **18 Upcoming Flea Markets & Weekend Markets In Singapore 2026 - Sassy Mama Singapore**
  - url: https://news.google.com/rss/articles/CBMifEFVX3lxTFBaTkluZ1ZsVlhrQjNpdnR2aHc4Njc3V21zZHdVN08yTDRKamxMRWJfdjlBbmgwQW50QTQxMFlkS1JIZkp0bS15eG45SmZ0blN5bXlnRHNjRVJ0bWFaSlBIOXFqc1JZa2tpX3dOeUw4QXlTZzNkb1UwNG1oTlE?oc=5
  - published_at: Wed, 20 May 2026 07:00:00 GMT
  - author/agency: Sassy Mama Singapore
  - summary: <a href="https://news.google.com/rss/articles/CBMifEFVX3lxTFBaTkluZ1ZsVlhrQjNpdnR2aHc4Njc3V21zZHdVN08yTDRKamxMRWJfdjlBbmgwQW50QTQxMFlkS1JIZkp0bS15eG45SmZ0blN5bXlnRHNjRVJ0bWFaSlBIOXFqc1JZa2tpX3dOeUw4QXlTZzNkb1UwNG1oTlE?oc=5" target="_blank">18 Upcoming Flea Markets & Weekend Markets In Singapore 2026

- **Singapore's jewellery market set to grow 5% annually, but shrinking craftsmen pool a concern - CNA**
  - url: https://news.google.com/rss/articles/CBMixAFBVV95cUxQOVNfRG54cldjWlpieUZqQ1h6V0I1ZXVITFBnWkhpSV81aTdsaDFyTVhqX1RpTS1KczFEdVBJYlpNYmZxaXdUOHJXTkZQaEgyb3RMRDZBZG9aX19pYi1KWTN6cmEzdXdtVldxYUNmaEhYZmx5ZUZ2Z0lfR0RxNFg0d21ybi1PR1lOYTZSTDZwT1l2TGlaNUhIdXVuZWowZ0VsZGVSS0xLaTBiWGFPU1NQbGJtbWM1VUxsakdjZktnQnEwZ0Rw?oc=5
  - published_at: Fri, 11 Jul 2025 07:00:00 GMT
  - author/agency: CNA
  - summary: <a href="https://news.google.com/rss/articles/CBMixAFBVV95cUxQOVNfRG54cldjWlpieUZqQ1h6V0I1ZXVITFBnWkhpSV81aTdsaDFyTVhqX1RpTS1KczFEdVBJYlpNYmZxaXdUOHJXTkZQaEgyb3RMRDZBZG9aX19pYi1KWTN6cmEzdXdtVldxYUNmaEhYZmx5ZUZ2Z0lfR0RxNFg0d21ybi1PR1lOYTZSTDZwT1l2TGlaNUhIdXVuZWowZ0VsZGVSS0xLaTBiWGFPU1NQbGJtbWM1VUxsak

- **A Gold Market jewellery exhibition is now on at Dover Street Market Singapore - Vogue Singapore**
  - url: https://news.google.com/rss/articles/CBMia0FVX3lxTE53VE1wYU5iRW1zdmVrejM5VmtTaWVmSjlEOEh6dVdvbG9JMlozTTBLTFNKdUxRMkZjVHdtQWZhYkVZcEhXQThTcHZENTV5eXhCbWo0S3ZMX1F0cVlTaFhjVXM4aWRVeWpiZmk0?oc=5
  - published_at: Thu, 13 Nov 2025 08:00:00 GMT
  - author/agency: Vogue Singapore
  - summary: <a href="https://news.google.com/rss/articles/CBMia0FVX3lxTE53VE1wYU5iRW1zdmVrejM5VmtTaWVmSjlEOEh6dVdvbG9JMlozTTBLTFNKdUxRMkZjVHdtQWZhYkVZcEhXQThTcHZENTV5eXhCbWo0S3ZMX1F0cVlTaFhjVXM4aWRVeWpiZmk0?oc=5" target="_blank">A Gold Market jewellery exhibition is now on at Dover Street Market Singapore</a>&n

#### Market TH  (73 records)

- **รอบรั้วการตลาด : Heritage Fine Art & Jewelry เปิดเกมรุกตลาดไลฟ์สไตล์คนรุ่นใหม่ - Thairath.co.th**
  - url: https://news.google.com/rss/articles/CBMiggFBVV95cUxOeWJTSzVzVDFFWVhSOWtFaXJfSVdEVDNUSF82UERlVHhxOER0bjZoOW0wQzh3S0VYV05WOTlMZ001aHRVbl9WYTk1WnprRWx2dS01ek9WdjV1czIzU3ZDbEV0VWgtUDgwQ0dHalhHMzlIVC1oZkp6dHd5VEVuUTBkMXB3?oc=5
  - published_at: Sun, 07 Dec 2025 08:00:00 GMT
  - author/agency: Thairath.co.th
  - summary: <a href="https://news.google.com/rss/articles/CBMiggFBVV95cUxOeWJTSzVzVDFFWVhSOWtFaXJfSVdEVDNUSF82UERlVHhxOER0bjZoOW0wQzh3S0VYV05WOTlMZ001aHRVbl9WYTk1WnprRWx2dS01ek9WdjV1czIzU3ZDbEV0VWgtUDgwQ0dHalhHMzlIVC1oZkp6dHd5VEVuUTBkMXB3?oc=5" target="_blank">รอบรั้วการตลาด : Heritage Fine Art & Jewelry เปิดเก

- **รวมทุกข้อมูลด้านการลงทุนและผลิตภัณฑ์ในเว็บเดียว ให้การเช็กราคาทองหรือซื้อทองออนไลน์ง่ายเพียงปลายนิ้วสัมผัส - ฮั่วเซ่งเฮง**
  - url: https://news.google.com/rss/articles/CBMiRkFVX3lxTE1pR2FUZFFtMng3VEVrVG1PR0Q5ejJpNTFQRDlOTHN1OER5Z0JaQjNSZ2F6SG5XTXVnWjdBU2ZPOTZpRmF1Unc?oc=5
  - published_at: Mon, 04 Aug 2025 09:17:00 GMT
  - author/agency: ฮั่วเซ่งเฮง
  - summary: <a href="https://news.google.com/rss/articles/CBMiRkFVX3lxTE1pR2FUZFFtMng3VEVrVG1PR0Q5ejJpNTFQRDlOTHN1OER5Z0JaQjNSZ2F6SG5XTXVnWjdBU2ZPOTZpRmF1Unc?oc=5" target="_blank">รวมทุกข้อมูลด้านการลงทุนและผลิตภัณฑ์ในเว็บเดียว ให้การเช็กราคาทองหรือซื้อทองออนไลน์ง่ายเพียงปลายนิ้วสัมผัส</a>&nbsp;&nbsp;<font colo

- **Blue Ocean แห่งศรัทธา ‘Harmenstone’ โอกาสหมื่นล้านในตลาดเครื่องประดับสายมู | การเงินธนาคาร - LINE TODAY**
  - url: https://news.google.com/rss/articles/CBMiVkFVX3lxTE12c2dhSGFDTFJ5RzBRSFdndUFjSXFHblZkRmhUbmlmcGNGQ1JDVVd4VXloa1RheVkyVDFiVUtRQS1IRjVxTTljX001dGtyMjlZbG95SWd3?oc=5
  - published_at: Fri, 17 Apr 2026 07:00:00 GMT
  - author/agency: LINE TODAY
  - summary: <a href="https://news.google.com/rss/articles/CBMiVkFVX3lxTE12c2dhSGFDTFJ5RzBRSFdndUFjSXFHblZkRmhUbmlmcGNGQ1JDVVd4VXloa1RheVkyVDFiVUtRQS1IRjVxTTljX001dGtyMjlZbG95SWd3?oc=5" target="_blank">Blue Ocean แห่งศรัทธา ‘Harmenstone’ โอกาสหมื่นล้านในตลาดเครื่องประดับสายมู | การเงินธนาคาร</a>&nbsp;&nbsp;<font

#### Market US  (74 records)

- **Demi-Fine Jewelry Market to Reach US$ 5.6 Billion by 2033 Expanding at 11.6% CAGR | Persistence Market Research - openPR.com**
  - url: https://news.google.com/rss/articles/CBMilwFBVV95cUxNMVpEZHJ0MFh4SjBwei1XVFB4cmNWNkpBWHB6TDJvQktYZTVuQlMwdWdSX3FDc2pZVGt3WGMyZzJaeU1FQVdreE5mQ1NCRUtfS1dGdkExbTA3X3RJdUlkYXFHajVpVzFTUllKUERYclJrSXRsdU1vYlhWYWQtTFZ2eFFYRFl0UDRtNndVVFNpUWI0UHI0dmpZ?oc=5
  - published_at: Wed, 20 May 2026 10:20:13 GMT
  - author/agency: openPR.com
  - summary: <a href="https://news.google.com/rss/articles/CBMilwFBVV95cUxNMVpEZHJ0MFh4SjBwei1XVFB4cmNWNkpBWHB6TDJvQktYZTVuQlMwdWdSX3FDc2pZVGt3WGMyZzJaeU1FQVdreE5mQ1NCRUtfS1dGdkExbTA3X3RJdUlkYXFHajVpVzFTUllKUERYclJrSXRsdU1vYlhWYWQtTFZ2eFFYRFl0UDRtNndVVFNpUWI0UHI0dmpZ?oc=5" target="_blank">Demi-Fine Jewelry Marke

- **The World's Jewelry Hotspots - Statista**
  - url: https://news.google.com/rss/articles/CBMilgFBVV95cUxQNURKUTVNdFFrTndPTEg2c3BVd05uR1BrTDJoeklHOHVXUVV4UWkwdFhPTmVlelBSaFRfZ1gwNXk4WFQ3empycjYzTGsyc2VwWTU2MXJPNHZTNTNYYi11N2xxbmQ4R2R2Wmh4VDZsSm9YdHI2STZkWGs3bVNOVVBSTDZQV3lnZFdsYjRXZERZYUgxbUt0clHSAZsBQVVfeXFMTVNyb3BBaXNHNHV2NU42WmpMTlVMQnZOTTZsSHRvekRPRk4wTThiSko3Zk9XbkJwclM2U0xHT0ZVUVVuVVkxMDlKS21fZkhYT3hPUllZU0p5Nkt1d0pXRDM2VlZyTjFjck9GRFFXWWNoSmU4RFh5OERRY092X21FaHppbFkzTnFHVWtkaDlWOVZxdmNPMHdvVlZSWFE?oc=5
  - published_at: Wed, 29 Apr 2026 07:00:00 GMT
  - author/agency: Statista
  - summary: <a href="https://news.google.com/rss/articles/CBMilgFBVV95cUxQNURKUTVNdFFrTndPTEg2c3BVd05uR1BrTDJoeklHOHVXUVV4UWkwdFhPTmVlelBSaFRfZ1gwNXk4WFQ3empycjYzTGsyc2VwWTU2MXJPNHZTNTNYYi11N2xxbmQ4R2R2Wmh4VDZsSm9YdHI2STZkWGs3bVNOVVBSTDZQV3lnZFdsYjRXZERZYUgxbUt0clHSAZsBQVVfeXFMTVNyb3BBaXNHNHV2NU42WmpMTlVMQnZOTT

- **Imitation Jewelry Market Size, Share, Trends, Report, 2034 - Fortune Business Insights**
  - url: https://news.google.com/rss/articles/CBMie0FVX3lxTE1HRXVkN0hrS0FRazFwNFIydml1c2l1SlRqMmRXNFhnb3FmQVBnZnJDS3JldFI2RFFMUW56MDMtMTRfUVFWMmdudmRDSUdFT2xMWnJod0pjU0RnZTkxZ3BpUEhPbzY4X0VGUGR2WGc4aExOOUoyVkI2MGZPTQ?oc=5
  - published_at: Wed, 06 May 2026 07:00:00 GMT
  - author/agency: Fortune Business Insights
  - summary: <a href="https://news.google.com/rss/articles/CBMie0FVX3lxTE1HRXVkN0hrS0FRazFwNFIydml1c2l1SlRqMmRXNFhnb3FmQVBnZnJDS3JldFI2RFFMUW56MDMtMTRfUVFWMmdudmRDSUdFT2xMWnJod0pjU0RnZTkxZ3BpUEhPbzY4X0VGUGR2WGc4aExOOUoyVkI2MGZPTQ?oc=5" target="_blank">Imitation Jewelry Market Size, Share, Trends, Report, 2034</a

#### Market VN  (75 records)

- **International media reveals Bao Tin Manh Hai's IPO plans. - Vietnam.vn**
  - url: https://news.google.com/rss/articles/CBMikgFBVV95cUxPam5GUlc0UGc2a0x5cHItaGlRTEx1d1JvbFhOT3NKT05INWdZSkNyNlc4S1d4MWRtYkRBTjd1aUxxby16RTc0c0dnX29XNWRfazJPQ1dQVVdfS0ZibjRJSzcwLTZsT2RzamdLWGV3MWszSjlUR2NEa3NWRE9CNTRLSXNqa3YyejVXOGRjUmRNRE40dw?oc=5
  - published_at: Tue, 19 May 2026 07:00:00 GMT
  - author/agency: Vietnam.vn
  - summary: <a href="https://news.google.com/rss/articles/CBMikgFBVV95cUxPam5GUlc0UGc2a0x5cHItaGlRTEx1d1JvbFhOT3NKT05INWdZSkNyNlc4S1d4MWRtYkRBTjd1aUxxby16RTc0c0dnX29XNWRfazJPQ1dQVVdfS0ZibjRJSzcwLTZsT2RzamdLWGV3MWszSjlUR2NEa3NWRE9CNTRLSXNqa3YyejVXOGRjUmRNRE40dw?oc=5" target="_blank">International media reveals B

- **Association proposes loosening controls on gold jewellery - vietnamnews.vn**
  - url: https://news.google.com/rss/articles/CBMiowFBVV95cUxOdzlKRm0tQnpJUmppazVILWlSekZVRDRqVVRxRmM1Q2RkcXJvOWVsel9VWFBYQmJYV25LU0RPSTJzYTdJa0dzVDFvTnpuekx0NjdicVA3clhQMDY3cFNOS093dEFRLWdib1YwWUNwSEFFS2dDV1pkN2RLeW9GcVFhWDhrSVpQV2NTN3lZUnMzNTZRcjR3TVJjU0Y1dXRIakpjMzF3?oc=5
  - published_at: Wed, 10 Dec 2025 08:00:00 GMT
  - author/agency: vietnamnews.vn
  - summary: <a href="https://news.google.com/rss/articles/CBMiowFBVV95cUxOdzlKRm0tQnpJUmppazVILWlSekZVRDRqVVRxRmM1Q2RkcXJvOWVsel9VWFBYQmJYV25LU0RPSTJzYTdJa0dzVDFvTnpuekx0NjdicVA3clhQMDY3cFNOS093dEFRLWdib1YwWUNwSEFFS2dDV1pkN2RLeW9GcVFhWDhrSVpQV2NTN3lZUnMzNTZRcjR3TVJjU0Y1dXRIakpjMzF3?oc=5" target="_blank">Associa

- **Hanoi to host ASEAN++ Expo Fair Vietnam Jewelry and Antiques 2025 - VOV**
  - url: https://news.google.com/rss/articles/CBMiswFBVV95cUxNZDJmWTBNamJhbEdJQWtMT0p0YVZHNVdhMGwtYWlIXzUySjdmVk5lYmpJOW93TnN0akpCSXlwcm5IN1V3UVhVTU9ranRyZURieUdmamwtV0xGSmJmaDFfQVcxMUdrV3pHRm5ONlpnbzFyLTRfc1JzWlBsVU1mdEJtMWxhT18wcVRJbTRxRnk2MlBDMDJ0VUYwTVFBU3U0Zmd2SWxJM2ZhaTdWX19RWHRfbUtEVQ?oc=5
  - published_at: Wed, 24 Dec 2025 08:00:00 GMT
  - author/agency: VOV
  - summary: <a href="https://news.google.com/rss/articles/CBMiswFBVV95cUxNZDJmWTBNamJhbEdJQWtMT0p0YVZHNVdhMGwtYWlIXzUySjdmVk5lYmpJOW93TnN0akpCSXlwcm5IN1V3UVhVTU9ranRyZURieUdmamwtV0xGSmJmaDFfQVcxMUdrV3pHRm5ONlpnbzFyLTRfc1JzWlBsVU1mdEJtMWxhT18wcVRJbTRxRnk2MlBDMDJ0VUYwTVFBU3U0Zmd2SWxJM2ZhaTdWX19RWHRfbUtEVQ?oc=5" t

---

## reddit  (383 records)

**By market**: GLOBAL=383

**By signal_type**: social_buzz=383

**Brand hits**: Cartier=7, Tiffany=6, Van Cleef=1

**Product hits**: engagement ring=55, wedding ring=6, lab grown diamond=3, gold necklace=1, gold jewelry=1

### Samples

#### Market GLOBAL  (383 records)

- **This or that!**
  - url: https://www.reddit.com/r/jewelry/comments/1tl3s0n/this_or_that/
  - published_at: 2026-05-23T02:35:25+00:00
  - author/agency: Use-yo-blinkR
  - summary: Which ring set do you like better? Why?

- **Bezel vs prong setting**
  - url: https://www.reddit.com/r/jewelry/comments/1tl350l/bezel_vs_prong_setting/
  - published_at: 2026-05-23T02:06:33+00:00
  - author/agency: CBG1955
  - summary: First world question!

I recently received this stunning piece, 2.5ct Asscher in a bezel setting.  I'm fully aware that the bezel prevents light from getting in underneath, and as a result some of the fire in the stone is lost, even in bright sunlight.  This photo was taken under a fairly bright LED

- **Practical advice about wedding ring style**
  - url: https://www.reddit.com/r/jewelry/comments/1tl2x30/practical_advice_about_wedding_ring_style/
  - published_at: 2026-05-23T01:56:53+00:00
  - author/agency: Elemental_Biscotti
  - summary: OK friends. I've got 4.5 months and really have to pick a wedding ring. 😅

I've narrowed it down to these basic choices. (Links are just for a basic idea of the style/look, not necessarily to buy from that particular seller.)

I would be happy with any of them I think and planning to get 10K rose go
  - entities: {"brands": [], "competitors": [], "products": ["engagement ring", "wedding ring"], "locations": []}

---

## tavily  (146 records)

**By market**: JP=46, TH=20, SG=18, MY=18, ID=18, VN=14, PH=12

**By signal_type**: consumer_behavior=140, competition=6

**Brand hits**: Cartier=3, Van Cleef=3, Van Cleef & Arpels=3, Tiffany=1, Chow Tai Fook=1

**Product hits**: engagement ring=1

### Samples

#### Market ID  (18 records)

- **Indonesia Exfoliating Body Brush - Market Analysis, Forecast, Size, Trends and Insights - IndexBox**
  - url: https://www.indexbox.io/store/indonesia-kw-exfoliating-body-brush-840-market-analysis-forecast-size-trends-and-insights/
  - published_at: Tue, 19 May 2026 21:25:30 GMT
  - summary: We use cookies to improve your experience and for marketing. Read our cookie policy or manage cookies. Search across reports, market insights, and blog stories. Type at least 3 characters to see fast results. Press Enter to see full results. Report Update May 19, 2026. # Indonesia Exfoliating Body B

- **India caps duty-free gold imports for jewellery exporters - Mining.com**
  - url: https://www.mining.com/web/india-caps-duty-free-gold-imports-for-jewellery-exporters/
  - published_at: Thu, 14 May 2026 15:28:55 GMT
  - summary: Silver Futures $ 75.495 / ozt  7.47%. Micro Gold Futures $ 4713.1 / ozt  3.80%. Micro Silver Futures $ 75.48 / ozt  7.54%. Gold Futures $ 4713.3 / ozt  3.84%. # India caps duty-free gold imports for jewellery exporters. India on Thursday tightened rules for duty-free gold imports for jewellery expor

- **Indonesia Mining Equipment Market Set to Reach USD 3.69 Billion - openPR.com**
  - url: https://www.openpr.com/news/4491541/indonesia-mining-equipment-market-set-to-reach-usd-3-69-billion
  - published_at: Mon, 27 Apr 2026 21:18:06 GMT
  - summary: # Indonesia Mining Equipment Market Set to Reach USD 3.69 Billion by 2031, Driven by EV Supply Chain Expansion, Downstream Processing Mandates- Mordor Intelligence. Mordor Intelligence has published a new report on the Indonesia mining equipment market, offering a comprehensive analysis of trends, g

#### Market JP  (46 records)

- **Jewelry influencers on their style tips, dream jewels for 2026 - New York Post**
  - url: https://nypost.com/2026/05/06/lifestyle/jewelry-influencers-on-their-style-tips-dream-jewels/
  - published_at: Wed, 06 May 2026 11:00:00 GMT
  - summary: # Jewelry influencers on their style tips, dream jewels for 2026. **Iconic red carpet moment:** One recent moment I loved was Anne Hathaway promoting “The Devil Wears Prada 2” in Bulgari’s High Jewelry Serpenti necklace. **First piece of jewelry:** My first meaningful piece of jewelry was a Cartier
  - entities: {"brands": ["Cartier", "Van Cleef", "Van Cleef & Arpels"], "competitors": [], "products": [], "locations": ["Japan"]}

- **The New Era of Necklaces Is Anything but Subtle - WWD**
  - url: https://wwd.com/fashion-news/fashion-scoops/amulet-necklace-spring-2026-trend-1238949048/
  - published_at: Mon, 11 May 2026 18:29:42 GMT
  - summary: ### Chanel Gives Color-filled Read of Its Signs and Symbols in New High Jewelry Collection. # How Amulet Necklaces Are Replacing Delicate Jewelry in 2026. The '90s-inspired style is getting a 2026 refresh. * Share this article on X. * Share this article on Talk. But the recent spring 2026 collection

- **Van Cleef & Arpels cashes in on lucrative secondary market for vintage jewellery - The Art Newspaper**
  - url: https://www.theartnewspaper.com/2026/05/07/van-cleef-arpels-cashes-in-on-lucrative-secondary-market-for-vintage-jewellery
  - published_at: Thu, 07 May 2026 11:51:52 GMT
  - summary: # Van Cleef & Arpels cashes in on lucrative secondary market for vintage jewellery. ## The jewellery designer's Heritage Collection presents rare 20th-century creations. Long before the present vogue for vintage jewellery took off, the manager of Van Cleef & Arpels’s flagship store on Fifth Avenue s
  - entities: {"brands": ["Van Cleef", "Van Cleef & Arpels"], "competitors": [], "products": [], "locations": ["Japan"]}

#### Market MY  (18 records)

- **Va-va vintage: London Jewelers searches the globe for heritage treasures - New York Post**
  - url: https://nypost.com/2026/05/11/lifestyle/va-va-vintage-london-jewelers-searches-the-globe-for-heritage-treasures/
  - published_at: Mon, 11 May 2026 11:00:00 GMT
  - summary: # Va-va vintage: London Jewelers searches the globe for heritage treasures. Vintage jewelry is having a moment. “There’s a demand for vintage and heritage jewelry,” says Candy Udell, president of London Jewelers. While estate and vintage jewelry has been a part of the business for a while, the compa

- **Malaysia and its Fintech Environment and Developments in 2026 - The Fintech Times**
  - url: https://thefintechtimes.com/malaysia-and-its-fintech-environment-and-developments-in-2026/
  - published_at: Tue, 12 May 2026 05:08:10 GMT
  - summary: * Malaysia and its Fintech Environment and Developments in 2026. #### *The following gives an overview of the fintech, digital and wider economic development of the Southeast Asian nation of Malaysia in 2026.*. Malaysia has long been viewed as one of Southeast Asia’s more structured digital economie

- **The 12 smaller US metros where $1M listings are surging - Stock Titan**
  - url: https://www.stocktitan.net/news/NWS/realtor-com-identifies-12-emerging-luxury-markets-gaining-high-end-08vtixrfyuue.html
  - published_at: Tue, 12 May 2026 10:00:00 GMT
  - summary: **Realtor.com (NASDAQ:NWS)** reports 12 emerging U.S. luxury housing markets where million‑dollar listings are expanding quickly. The national luxury threshold (90th percentile) was **$1,274,423 in April 2026**, up 2.0% month over month but 1.9% below April 2025. Fayetteville-Springdale-Rogers, Ark.

#### Market PH  (12 records)

- **Philippine Department of Tourism bets big on content creators for Vlogfest Philippines 2026 - travelweekly.com.au**
  - url: https://travelweekly.com.au/philippine-department-of-tourism-bets-big-on-content-creators-for-vlogfest-philippines-2026/
  - published_at: Mon, 11 May 2026 00:34:26 GMT
  - summary: Reading: Philippine Department of Tourism bets big on content creators for Vlogfest Philippines 2026. # Philippine Department of Tourism bets big on content creators for Vlogfest Philippines 2026. **Vlogfest Philippines 2026 has officially launched with a vibrant welcome event at WYP (What’s Your Po

- **Price shocks from the Iran war power solar sales in energy-hungry Asia - AP News**
  - url: https://apnews.com/article/iran-war-energy-asia-china-philippines-solar-d3e44801e1700410d4ab81e4fa517007
  - published_at: Wed, 13 May 2026 05:39:16 GMT
  - summary: Test Your News I.Q. 2026 Elections Election Results Election calendar White House Congress Supreme Court The latest AP-NORC polls Ground Game. A solar installer secures a solar panel onto the roof of a home in Manila, Philippines, on April 30, 2026. A solar installer secures a solar panel onto the r

- **Price shocks from the Iran war power solar sales in energy-hungry Asia - Bozeman Daily Chronicle**
  - url: https://www.bozemandailychronicle.com/ap_news/business/price-shocks-from-the-iran-war-power-solar-sales-in-energy-hungry-asia/article_96cb0e8d-04d1-54b4-ba9e-f58d8fdb1e46.html
  - published_at: Wed, 13 May 2026 05:52:05 GMT
  - summary: A solar installer secures a solar panel onto the roof of a home in Manila, Philippines, on April 30, 2026. A solar installer secures a solar panel onto the roof of a home in Manila, Philippines, on May 1, 2026. A team of solar installers haul a solar panel onto the roof of a home in Manila, Philippi

#### Market SG  (18 records)

- **Sharon Yuen Jewelry Design Redefines Traditional Jadeite with Award-Winning Contemporary Narrative Collections - markets.businessinsider.com**
  - url: https://markets.businessinsider.com/news/stocks/sharon-yuen-jewelry-design-redefines-traditional-jadeite-with-award-winning-contemporary-narrative-collections-1036074779
  - published_at: Wed, 29 Apr 2026 04:37:00 GMT
  - summary: # Sharon Yuen Jewelry Design Redefines Traditional Jadeite with Award-Winning Contemporary Narrative Collections. HONG KONG, April 29, 2026 (GLOBE NEWSWIRE) -- Sharon Yuen Jewelry Design today announced the expansion of its bespoke, appointment-only viewing services for its award-winning contemporar

- **Gold volatility tests jewelers - Chow Tai Fook bets on agility and youth appeal - CNBC**
  - url: https://www.cnbc.com/video/2026/05/13/sonia-cheng-on-chow-tai-fooks-strategy-amid-soaring-gold-prices.html
  - published_at: Wed, 13 May 2026 05:49:14 GMT
  - summary: Monday - Friday, 10:00 - 11:00 SIN/HK | 0400 - 05:00 CET. # Gold volatility tests jewelers - Chow Tai Fook bets on agility and youth appeal. With gold prices hitting record highs, Chow Tai Fook's Sonia Cheng says the jeweler is leaning into design-led collections with stronger storytelling and cultu
  - entities: {"brands": ["Chow Tai Fook"], "competitors": [], "products": [], "locations": ["Singapore"]}

- **JCK Presents The World’s Best Jewelry And Watches Of Tomorrow, Today - Forbes**
  - url: https://www.forbes.com/sites/kyleroderick/2026/05/21/jck-presents-the-worlds-best-jewelry-and-watches-of-tomorrow-today/
  - published_at: Thu, 21 May 2026 00:00:00 GMT
  - summary: “The Luxury and JCK show floors,” she predicted, “will tell a nuanced story about this industry’s resilience and creativity.” For example, she related, “Thestrength of sterling silver and demi-fine jewelry, as well as other metals and materials at JCK this year will showcase the ingenuity of designe

#### Market TH  (20 records)

- **Cosmoprof CBE ASEAN 2026 Expands with the Launch of Cosmopack CBE ASEAN - Beauty Packaging**
  - url: https://www.beautypackaging.com/library/cosmoprof-cbe-asean-2026-expands-with-the-launch-of-cosmopack-cbe-asean/
  - published_at: Tue, 12 May 2026 18:51:02 GMT
  - summary: # Cosmoprof CBE ASEAN 2026 Expands with the Launch of Cosmopack CBE ASEAN. Taking place from June 24 to 26, 2026, at the Queen Sirikit National Convention Center in Bangkok, Cosmoprof CBE ASEAN returns as a strategic B2B platform for Southeast Asia’s fast-growing beauty market. The 2026 edition will

- **ProPak Asia 2026 Relocates to IMPACT Muang Thong Thani, Expanding Space to Accommodate Modern Manufacturing and Packaging Industries - ThaiPR.NET**
  - url: https://www.thaipr.net/en/manufacturing_en/3718584
  - published_at: Thu, 07 May 2026 05:14:12 GMT
  - summary: # ProPak Asia 2026 Relocates to IMPACT Muang Thong Thani, Expanding Space to Accommodate Modern Manufacturing and Packaging Industries. Informa Markets Thailand Highlights Continued Growth in Food, Beverage, Pharma, and Packaging Amid Transition to Industry 5.0, Elevating ProPak Asia 2026 into a Reg

- **LUYUAN Launches Southeast Asia Supply Integration Center in Thailand, Capturing Exponential Growth with 'China Technology + Local Manufacturing' - The Manila Ti**
  - url: https://www.manilatimes.net/2026/05/07/tmt-newswire/pr-newswire/luyuan-launches-southeast-asia-supply-integration-center-in-thailand-capturing-exponential-growth-with-china-technology-local-manufacturing/2338087
  - published_at: Thu, 07 May 2026 09:27:00 GMT
  - summary: # LUYUAN Launches Southeast Asia Supply Integration Center in Thailand, Capturing Exponential Growth with "China Technology + Local Manufacturing". SHANGHAI, May 7, 2026 /PRNewswire/ -- LUYUAN Group (HK.02451), a global leader in electric two-wheelers, today announced the establishment of its Southe

#### Market VN  (14 records)

- **Opinion | The market on the Mekong - The Washington Post**
  - url: https://www.washingtonpost.com/opinions/2026/04/29/vietnam-market-economy-stands-gain-us-recognition/
  - published_at: Wed, 29 Apr 2026 20:06:14 GMT
  - summary: Communist Vietnam is a state-run command economy in name only. Yet the Commerce Department still classifies Vietnam as a “non-market economy.” That places the country in a league with China, Russia and Belarus. Vietnam first began significantly embracing free markets 40 years ago. The Commerce Depar

- **Booths Filling Fast: Industrial Technology World Asia Vietnam 2026 Targets ASEAN's Manufacturing Boom - The Manila Times**
  - url: https://www.manilatimes.net/2026/05/12/tmt-newswire/pr-newswire/booths-filling-fast-industrial-technology-world-asia-vietnam-2026-targets-aseans-manufacturing-boom/2341277
  - published_at: Tue, 12 May 2026 02:18:07 GMT
  - summary: # Booths Filling Fast: Industrial Technology World Asia Vietnam 2026 Targets ASEAN's Manufacturing Boom. HANOI, Vietnam, May 12, 2026 /PRNewswire/ -- As global supply chains accelerate their shift toward Southeast Asia, Vietnam is rapidly emerging as one of the world's most dynamic manufacturing hub

- **| Vietnam's flat apparel exports hide the real trade signal - Fibre2Fashion**
  - url: https://www.fibre2fashion.com/news/apparel-news/vietnam-s-flat-apparel-exports-hide-the-real-trade-signal-310336-newsdetails.htm
  - published_at: Fri, 15 May 2026 08:48:23 GMT
  - summary: Join global fibre leaders at Dornbirn GFC 2026 and save 20% with Early Bird tickets | Register Now. Source innovative home textile products and trends at Intertextile Shanghai Home Textiles 2026 | Explore More. * Brunello CEO at GFS 2026: My generation is the last to buy blindly. * US T&A imports fa

---

## Legacy SG probe outputs (output/normalized/*.json)

- `news_20260521T134550Z.json` — 60 records
- `news_20260522T040730Z.json` — 60 records
- `news_20260522T040833Z.json` — 60 records
- `news_20260522T053143Z.json` — 60 records
- `platform_policy_20260521T110550Z.json` — 2 records
- `platform_policy_20260521T113146Z.json` — 19 records
- `platform_policy_20260521T134605Z.json` — 19 records
- `platform_policy_20260522T053025Z.json` — 17 records
- `regulation_20260521T110555Z.json` — 11 records
- `regulation_20260521T134610Z.json` — 11 records

## Raw HTML snapshots (parse_failed)

- `output/raw/lazada_open_platform_20260523T023307Z.html` — 23314 bytes
