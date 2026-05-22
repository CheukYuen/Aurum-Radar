# Aurum Radar — Frontend

React + TypeScript + Vite SPA. 高级珠宝品牌海外市场战略情报看板。

## 启动

```bash
npm install
npm run dev        # http://localhost:5173，需后端在 8000 端口
npm run build      # 生产构建，tsc -b && vite build
```

后端代理：`/api/*` → `http://localhost:8000`（见 `vite.config.ts`）

## 目录结构

```
src/
  api/
    index.ts        # 所有 fetch 函数（fetchCountries, fetchLatestBrief 等）
    types.ts        # 全局类型（PageId, CountryDetail, DailyBrief 等）
    mapLayout.ts    # 世界地图国家坐标静态数据
  components/
    agent/
      AgentChatDrawer.tsx   # Global Agent Chat 右滑抽屉（420px）
    overview/
      OverviewPage.tsx      # 概览主页（世界地图 + 右侧国家判断面板）
      WorldMap.tsx          # SVG 世界地图，点击国家触发 onSelect
      CountryPanel.tsx      # 右侧"今日市场判断"面板
      KeyAnalysis.tsx       # 关键分析卡片
      BusinessImpact.tsx    # 业务影响模块
      DailyBriefingDrawer.tsx # 每日战略简报右滑抽屉（560px）
    intel/
      IntelPage.tsx         # 情报中心页面
      EventCard.tsx         # 情报事件卡片
      IntelDetail.tsx       # 事件详情
    actions/
      ActionsPage.tsx       # 行动建议页面
      DeptCard.tsx          # 部门卡片
      ActionDetail.tsx      # 行动详情
    map/
      MapInsightPage.tsx    # ⚠ 已下线，不再路由到此页面
      SingaporeMap.tsx      # 新加坡地区地图（仅供参考，已从导航移除）
      RegionPanel.tsx
    shell/
      TopBar.tsx            # 顶部栏（过滤器 + Ask Agent + 查看简报）
      Sidebar.tsx           # 左侧导航（概览 / 情报中心 / 行动建议）
    ui/
      Icon.tsx              # 图标组件（Material Symbols Rounded）
      DiamondMark.tsx       # 品牌钻石装饰
  index.css         # 设计 Token + 全局样式 + 动画 keyframes
  main.tsx
  App.tsx           # 路由状态、briefing/agentChat 开关
```

## 页面路由

`PageId = 'overview' | 'intel' | 'actions'`（在 `api/types.ts` 定义）

- `overview` → OverviewPage（默认）
- `intel`    → IntelPage
- `actions`  → ActionsPage

**地图洞察（`'map'`）已从 PageId 移除**，`MapInsightPage` 不再挂载。

## 设计系统

所有颜色、字体、阴影均通过 CSS 变量定义在 `index.css :root`：

| 变量前缀 | 用途 |
|---|---|
| `--ivory` / `--pearl` / `--silk` | 背景层次 |
| `--ink-1` ~ `--ink-5` | 文字层次 |
| `--gold-1` ~ `--gold-4` / `--gold-tint` / `--gold-wash` | 品牌金色 |
| `--sage` / `--clay` / `--indigo` / `--plum` | 状态色 |
| `--line` / `--line-strong` / `--line-soft` | 描边 |
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | 阴影 |
| `--font-serif` / `--font-sans` / `--font-mono` | 字体 |

CSS 类：`.card`、`.chip`（`.chip.sage` `.chip.clay` 等）、`.facet-rule`、`.gold-divider`、`.num-display`

Tailwind 仅用于布局辅助类（`flex`、`gap-*`、`items-center` 等），不用于颜色/设计 Token。

## 两个右侧抽屉

| 抽屉 | 宽度 | zIndex | 触发 |
|---|---|---|---|
| DailyBriefingDrawer | 560px | 51 | 「查看今日战略简报」按钮 |
| AgentChatDrawer | 420px | 51 | 「Ask Agent」按钮 / 简报内 4 个追问按钮 |

两者互斥：打开任意一个会关闭另一个（在 `App.tsx` 的 `openBriefing` / `openAgentChat` 中控制）。

AgentChatDrawer 使用 `key={agentChatKey}` 强制重挂载，确保每次打开时对话历史清空。

## Agent Chat 预设问答

`AgentChatDrawer.tsx` 内置 `CANNED` map，对以下问题返回结构化回复：
- 为什么今天新加坡被判断为机会增强？
- 金价高位对哪些产品线影响最大？
- 今天有哪些 P0 / P1 行动建议？
- 哪些判断有最高可信来源？
- 解释今日战略判断的主要依据

其余问题返回 `FALLBACK` 通用回复。回复结构：直接结论 / 判断依据 / 相关事件 / 来源引用 / 建议下一步。

## 注意事项

- **不要重构整体布局与视觉风格**，局部调整即可
- 内联 style 优先，Tailwind 仅补充布局
- 不要使用 `px` 以外的单位（设计稿均为 px）
- 动画 keyframes 定义在 `index.css` 底部：`drawer-slide-in`、`backdrop-fade-in`、`item-fade-up`、`agent-pulse`
- Icon 组件：`<Icon name="..." size={n} />` — 可用名称见 `Icon.tsx`
- `@tailwind` 的 IDE 警告（unknownAtRules）为正常现象，不影响构建
