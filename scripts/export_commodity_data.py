#!/usr/bin/env python3
"""Export commodity_cache.json → clean commodities.json for dashboard."""

import json
import os
from datetime import datetime, timezone

CACHE_PATH = os.path.expanduser("~/.hermes/data/commodity_cache.json")
DATA_DIR = os.path.expanduser("~/commodity-dashboard")
OUT_PATH = os.path.join(DATA_DIR, "data", "commodities.json")

# Cache-to-display name mapping (collector still writes old names)
CACHE_KEY_MAP = {
    "Ammonia CFR": "Ammonia FE",
    "Ammonia FOB": "Ammonia ME",
}

SECTOR_CONFIG = {
    "Energy": {"icon": "⚡", "items": ["Coal", "Brent", "Coal/Gold"]},
    "Fertilizer & Feedstock": {"icon": "\U0001f9ea", "items": ["LNG JKM", "Urea", "DAP", "Ammonia FE", "Ammonia ME"]},
    "Metals": {"icon": "🏅", "items": ["Gold", "Copper", "Copper/Gold"]},
    "Plastics & Agri": {"icon": "🛢️", "items": ["CPO", "Polyethylene", "PP"]},
}

# Commodities to render as dual-line charts (share one canvas)
CHART_GROUPS = {
    "Fertilizer & Feedstock": [
        {"id": "ammonia", "commodities": ["Ammonia FE", "Ammonia ME"], "title": "Ammonia (FE vs ME)"},
    ],
}

COMMODITY_COLORS = {
    "Coal": "#ff6b6b", "LNG JKM": "#ffa726", "Brent": "#ef5350",
    "Urea": "#66bb6a", "DAP": "#42a5f5", "Ammonia FE": "#ab47bc",
    "Ammonia ME": "#7e57c2", "Gold": "#ffd54f", "Copper": "#ff7043",
    "Coal/Gold": "#78909c", "Copper/Gold": "#26a69a",
    "CPO": "#8d6e63", "Polyethylene": "#4fc3f7", "PP": "#ba68c8",
}

COMMODITY_UNITS = {
    "Coal": "USD/T", "LNG JKM": "USD/MMBTU", "Brent": "USD/Bbl",
    "Urea": "USD/T", "DAP": "USD/T", "Ammonia FE": "USD/T",
    "Ammonia ME": "USD/T", "Gold": "USD/oz", "Copper": "USD/lb",
    "CPO": "USD/T", "Polyethylene": "USD/T", "PP": "USD/T",
    "Coal/Gold": "×100", "Copper/Gold": "×1000",
}

TREND_UP = "\u2197"
TREND_DOWN = "\u2198"
TREND_FLAT = "\u2192"

def compute_pct_change(history, timestamps, current_price, days=1):
    """Compute % change over last N trading days."""
    if len(history) < 2:
        return None
    if days >= len(history):
        return None
    old_price = history[-(days + 1)]
    if old_price == 0:
        return None
    return round((current_price - old_price) / old_price * 100, 1)

def compute_trend(history):
    """Compute 1-week trend arrow. Compare avg(last 2) vs avg(first 2) of last 7 pts."""
    if len(history) < 4:
        return "—"
    recent = history[-2:]
    window = history[-min(7, len(history)):]
    older = window[:2]
    chg = (sum(recent) / len(recent) - sum(older) / len(older)) / (sum(older) / len(older)) * 100
    if chg >= 1.0:
        return TREND_UP
    elif chg <= -1.0:
        return TREND_DOWN
    return TREND_FLAT

def format_timestamps(timestamps):
    """Format ISO timestamps to short date strings (dd/mm) for chart labels."""
    return [datetime.fromisoformat(t).strftime("%d/%m") for t in timestamps]

def main():
    with open(CACHE_PATH) as f:
        cache = json.load(f)

    # Remap old cache keys to new names
    for old_key, new_key in CACHE_KEY_MAP.items():
        if old_key in cache and new_key not in cache:
            cache[new_key] = cache.pop(old_key)

    now = datetime.now(timezone.utc)
    sectors = []

    for sector_name, cfg in SECTOR_CONFIG.items():
        commodities = []
        for item_name in cfg["items"]:
            entry = cache.get(item_name)
            if not entry:
                continue

            history = entry.get("history", [])
            timestamps = entry.get("timestamps", [])
            price = entry.get("price", history[-1] if history else None)
            if price is None:
                continue

            # Format price to reasonable precision
            if price < 10:
                formatted_price = round(price, 2)
            elif price < 100:
                formatted_price = round(price, 2)
            elif price < 1000:
                formatted_price = round(price, 1)
            else:
                formatted_price = round(price, 0)

            # Trim history to match available timestamps so label→value alignment is correct
            labels = format_timestamps(timestamps[-len(history):]) if timestamps else []
            if labels and len(labels) < len(history):
                trimmed_history = history[-len(labels):]
            else:
                trimmed_history = history

            commodities.append({
                "name": item_name,
                "price": formatted_price,
                "raw_price": price,
                "unit": COMMODITY_UNITS.get(item_name, ""),
                "color": COMMODITY_COLORS.get(item_name, "#ffffff"),
                "change_1d": compute_pct_change(history, timestamps, price, 1),
                "change_1w": compute_pct_change(history, timestamps, price, min(7, max(1, len(history) - 1))),
                "trend": compute_trend(history),
                "history": trimmed_history,
                "labels": labels,
                "data_points": len(history),
            })

        if commodities:
            sectors.append({
                "name": sector_name,
                "icon": cfg["icon"],
                "commodities": commodities,
                "chart_groups": CHART_GROUPS.get(sector_name, []),
            })

    output = {
        "updated": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_label": now.strftime("%d %b %Y %H:%M UTC"),
        "sectors": sectors,
        "total_commodities": sum(len(s["commodities"]) for s in sectors),
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Exported {output['total_commodities']} commodities across {len(sectors)} sectors → {OUT_PATH}")

if __name__ == "__main__":
    main()
