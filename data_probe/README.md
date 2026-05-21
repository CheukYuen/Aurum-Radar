# Aurum Radar — Data Probe

This directory is a **lightweight data source validation layer** for the MVP phase.

Its sole purpose is to verify whether each configured data source can be:
- Successfully requested
- Parsed for title / links / summary
- Saved as JSON for downstream Agent consumption

> This is NOT the production backend. Once a source is validated here, its
> integration logic migrates to `backend/services/`.

---

## Quick Start

```bash
cd data_probe
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — add API keys (optional; probes skip gracefully if absent)
python scripts/run_all.py
```

---

## Directory Layout

```
data_probe/
├── config/
│   └── sources.yaml          # All data source definitions
├── scripts/
│   ├── utils.py              # Shared HTTP, parsing, output helpers
│   ├── probe_news.py         # News sites
│   ├── probe_competitors.py  # Competitor brand pages
│   ├── probe_platform_policy.py  # Shopee / Lazada policy pages
│   ├── probe_regulations.py  # Government / regulatory sites
│   ├── probe_market_data.py  # GoldAPI + ExchangeRate-API
│   ├── probe_malls.py        # Luxury mall event pages
│   └── run_all.py            # Orchestrator — runs everything
├── output/
│   ├── raw/                  # Raw HTML metadata + extracted links
│   ├── normalized/           # Standardised records (ready for Agent)
│   └── summary_*.json        # Per-run summary report
├── .env.example
└── requirements.txt
```

---

## Running Individual Probes

Each script is standalone:

```bash
python scripts/probe_news.py
python scripts/probe_competitors.py
python scripts/probe_platform_policy.py
python scripts/probe_regulations.py
python scripts/probe_market_data.py
python scripts/probe_malls.py
```

---

## Output Format

Every probe writes two JSON files per run:

**`output/raw/{source_type}_{timestamp}.json`** — raw metadata (HTML length, all extracted links).

**`output/normalized/{source_type}_{timestamp}.json`** — standardised records:

```json
{
  "source_type": "news",
  "market": "Singapore",
  "entity": "Channel News Asia",
  "title": "Gold jewellery demand rises in Q1",
  "summary": null,
  "url": "https://...",
  "published_at": null,
  "fetched_at": "2026-05-21T10:00:00+00:00",
  "status": "success",
  "error": null
}
```

Possible `status` values: `success` | `failed` | `skipped`

---

## Environment Variables

| Variable | Purpose | Required |
|---|---|---|
| `GOLDAPI_API_KEY` | GoldAPI.io gold price | No — skips gracefully |
| `EXCHANGE_RATE_API_KEY` | ExchangeRate-API FX rates | No — skips gracefully |
| `NEWS_API_KEY` | Reserved for NewsAPI.org | No |
| `SERPAPI_API_KEY` | Reserved for SerpAPI | No |
| `FIRECRAWL_API_KEY` | Reserved for Firecrawl | No |
| `REQUEST_TIMEOUT` | HTTP timeout in seconds (default: 15) | No |

---

## Adding a New Source

Edit `config/sources.yaml` and add an entry under the relevant key. The probe
scripts read from YAML — no code changes needed for new URLs.
