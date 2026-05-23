# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Setup
pip install -r requirements.txt
cp .env.example .env   # then fill in DATABASE_URL and DASHSCOPE_API_KEY

# Run API server (from backend/)
uvicorn app.main:app --reload --port 8000
# Docs: http://localhost:8000/docs  Health: http://localhost:8000/api/health

# Ingest today's data_probe crawler output into DB
.venv/bin/python -m scripts.ingest_crawl_data
# Options: --date 2026-05-23 | --all | --dry-run

# Run pipeline stages 3-6 + council + evaluation on raw_documents already in RDS
.venv/bin/python -m scripts.run_council
# Options: --market Singapore | --since 30d | --until 2026-05-22 | --limit 50 | --no-evaluation

# Trigger pipeline via API
curl -X POST http://localhost:8000/api/jobs/run \
  -H "Content-Type: application/json" \
  -d '{"markets": ["Singapore"], "stages": ["ingest", "extract"]}'

# DB migrations
alembic upgrade head
alembic revision --autogenerate -m "description"
```

No test suite exists yet. There is no linter or formatter configured.

## Architecture

### Layer structure

```
api/          Protocol layer only — routes call services, never write business logic
services/     One subdirectory per pipeline stage (see below)
database/     repository.py maps pipeline schemas → ORM models; session.py holds the engine
models/       SQLAlchemy ORM (8 tables)
schemas/      Pydantic contracts passed between stages (pipeline.py) and enums
core/config.py  All env vars via pydantic-settings — the only place that reads .env
```

### The 7-stage pipeline (`services/pipeline.py`)

`run_pipeline()` chains stages sequentially via `PipelineContext`, which carries in-memory data and the DB session between stages. Every stage is idempotent and can be run standalone. Stage failure stops the chain.

| Stage | Module | Persists to |
|---|---|---|
| 1 Ingest | `ingestion/providers.py` | memory only |
| 2 Clean | `ingestion/clean.py` | `raw_documents` (dedup by `content_hash`) |
| 3 Extract | `extraction/extractor.py` | memory only (persisted at Score) |
| 4 Score | `scoring/scorer.py` | `intelligence_events` |
| 5 Forecast | `forecast/forecaster.py` | `market_snapshots` |
| 6 Brief | `brief/generator.py` | `daily_briefs` |
| 7 Action | `council/orchestrator.py` | `council_reports` + `action_items` |

### Ingestion: data_probe → DB bridge

`data_probe/` (separate venv, no cross-import) produces JSONL and JSON files in `output/normalized/`. The bridge is `scripts/ingest_crawl_data.py`, which calls:
- `load_jsonl_documents(path)` — for new 18-field PRD schema (global probes)
- `load_seed_documents(path)` — for old 11-field SG MVP schema

Both compute `content_hash` with `_compute_content_hash()` matching `data_probe/scripts/utils.py dedupe_key()` (sha1 of normalized URL, or sha1 of `source_name|title|published_at`). `save_raw_documents()` uses `ON CONFLICT DO NOTHING` on `content_hash` for idempotent re-runs.

`DATA_PROBE_OUTPUT_DIR` in `.env` points to the JSONL directory (default `../data_probe/output/normalized`).

### Stage 7: Strategic Intelligence Council (`services/council/`)

Stage 7 is not a single LLM call — it runs 5 expert agents in parallel, then a Chief Strategy Officer synthesizes:

```
intelligence_events → adapter.py → intelligence_batch
    ├── product_marketing_strategist
    ├── competitor_strategy_analyst
    ├── consumer_insight_analyst       → chief_strategy_officer → council_reports
    ├── risk_compliance_analyst                                 → action_items
    └── military_strategist (兵法谋士)
```

Expert prompts are markdown files under `services/council/skills/jewelry_intelligence_council/experts/`. The military strategist additionally ingests `knowledge/strategy_library.json` (12 bespoke strategies) and vendored skill files for Sun Tzu and Mao Zedong's strategic frameworks.

`adapter.py` converts `intelligence_events` rows into the `intelligence_batch` JSON shape required by `input_schema.json`, directly passing through `env_factors`, `conduction_chain`, `intensity`, `entities`, and `downstream_implications` from Stage 3.

### Dual-axis extraction (Stage 3)

Every `intelligence_event` carries two axes from the LLM extraction:
- **Source axis** (`source_category`): where the signal came from (competition / product / social_media / regulation / channel / macro / supply_chain)
- **Environmental factor axis** (`env_factors`): how it acts on the market (F1–F7: supply_constraint → channel_power_shift), plus `conduction_chain` (A–E)

Stage 4 scoring uses `intensity × confidence` as base score. Stages 5–7 cluster on `env_factors[primary]` + `conduction_chain`, not on `source_category`. Full field rules are in `preclassify_extract.md`.

### LLM integration (`services/llm/dashscope.py`)

Uses the OpenAI SDK pointed at DashScope's OpenAI-compatible endpoint. Model tiering:
- `qwen-flash` — light classification
- `qwen-plus` — extraction / brief / action (default)
- `qwen-max` — complex reasoning (council synthesis)

All LLM calls must use `response_format=json_object`, `temperature 0.2–0.4`, and retry on failure. Never swallow exceptions — log them and re-raise.

### OSS (`services/storage/oss.py`)

`OSSStorage` lazily imports `oss2` so the app boots without OSS configured. MVP stores text content directly in `raw_documents.raw_content` (DB column); `oss_path` is reserved for large blobs but is currently unused in the pipeline. Do not start writing to OSS without discussing first — it's intentionally deferred.

### Environment design

All environment differences (local public endpoint vs ECS internal endpoint) are handled exclusively via `.env`. Never write `if APP_ENV == "local"` branches in code. The three `.env` fields that matter most: `DATABASE_URL`, `OSS_ENDPOINT`, `DASHSCOPE_BASE_URL`.

`SCHEDULER_ENABLED=false` locally — use `POST /api/jobs/run` or the `scripts/` entry points instead.

### What's stubbed vs implemented

- **Implemented**: DB models + migrations, repository layer, pipeline orchestration skeleton, council (Stage 7), ingestion bridge (`ingest_crawl_data.py`), `run_council.py` (reads raw_documents from RDS → stages 3-6 + council + eval)
- **Stubbed (raise NotImplementedError or log warning)**: all Provider `fetch()` methods in `ingestion/providers.py`, all API routes except `/api/health`, extraction/scoring/forecast/brief service logic
- **Not yet created**: `alembic/` migrations, `app/scheduler/`, `tests/`
