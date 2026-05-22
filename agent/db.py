import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent / "aurum.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    market TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    impact TEXT,
    related_brands TEXT,
    source_url TEXT NOT NULL,
    source_type TEXT,
    published_at TEXT,
    extracted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    confidence REAL DEFAULT 0.7
);

CREATE TABLE IF NOT EXISTS briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brief_date TEXT NOT NULL,
    content_md TEXT NOT NULL,
    judgments_json TEXT NOT NULL,
    tool_trace_json TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""


def init():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.commit()
    return conn


def save_event(conn, event: dict):
    conn.execute(
        """
        INSERT INTO events (title, market, category, summary, impact,
                            related_brands, source_url, source_type,
                            published_at, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            event["title"],
            event["market"],
            event["category"],
            event["summary"],
            event.get("impact"),
            json.dumps(event.get("related_brands", [])),
            event["source_url"],
            event["source_type"],
            event.get("published_at", ""),
            event.get("confidence", 0.7),
        ),
    )
    conn.commit()


def query_events(conn, market: str = None, days: int = 7):
    sql = "SELECT * FROM events WHERE extracted_at >= datetime('now', ?)"
    params = [f"-{days} days"]
    if market:
        sql += " AND market = ?"
        params.append(market)
    sql += " ORDER BY extracted_at DESC"
    cur = conn.execute(sql, params)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]
