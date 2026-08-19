"""
ChainMind — Database & Persistence Manager
Supports Supabase Cloud PostgreSQL with seamless local SQLite / CSV fallback storage.
"""

import os
import json
import sqlite3
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_FILE = os.path.join(DATA_DIR, "chainmind.db")

# Try importing Supabase client if configured
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

SUPABASE_AVAILABLE = False
supabase_client = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        SUPABASE_AVAILABLE = True
        print("[Database] Connected to Supabase Cloud PostgreSQL.")
    except Exception as e:
        print(f"[Database] Supabase connection error: {e}. Falling back to SQLite.")

class DatabaseManager:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self._init_sqlite_db()

    def _init_sqlite_db(self):
        """Initialize local SQLite database schemas if not using Supabase."""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # Action logs table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            badge TEXT,
            action_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        # WhatsApp alert dispatches log table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS whatsapp_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT,
            sku TEXT,
            alert_message TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)

        conn.commit()
        conn.close()

    def log_action(self, badge: str, action_text: str):
        """Log system activity."""
        if SUPABASE_AVAILABLE and supabase_client:
            try:
                supabase_client.table("action_logs").insert({
                    "badge": badge,
                    "action_text": action_text
                }).execute()
                return
            except Exception:
                pass

        # Fallback SQLite
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO action_logs (badge, action_text) VALUES (?, ?)", (badge, action_text))
        conn.commit()
        conn.close()

    def log_whatsapp_alert(self, phone_number: str, sku: str, alert_message: str):
        """Record WhatsApp alert dispatch."""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO whatsapp_alerts (phone_number, sku, alert_message) VALUES (?, ?, ?)",
                       (phone_number, sku, alert_message))
        conn.commit()
        conn.close()

    def get_recent_action_logs(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve recent action logs."""
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute("SELECT badge, action_text, created_at FROM action_logs ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()

        logs = []
        for r in rows:
            logs.append({
                "badge": r[0],
                "action_text": r[1],
                "created_at": r[2]
            })
        return logs

db_manager = DatabaseManager()
