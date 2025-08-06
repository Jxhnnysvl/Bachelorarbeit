import os
import requests
from dotenv import load_dotenv
from datetime import datetime
from db import get_connection

load_dotenv(dotenv_path=".env")

print("🛠️ GANTNER API WIRD GELADEN...")

BASE_URL = os.getenv("API_BASE_URL")
TOKEN = os.getenv("API_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}"
}

def is_tracker_cached(tracker_id, date):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM tracker_data
        WHERE tracker_id = %s AND DATE(timestamp) = %s
        AND value IS NOT NULL
    """, (tracker_id, date))
    row = cur.fetchone()
    count = list(row.values())[0] if row else 0
    cur.close()
    conn.close()
    return count >= 24

def load_tracker_from_db(tracker_id, date):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT timestamp, value FROM tracker_data
        WHERE tracker_id = %s AND DATE(timestamp) = %s
        ORDER BY timestamp ASC
    """, (tracker_id, date))
    rows = cur.fetchall()
    hourly = [None] * 24
    for row in rows:
        timestamp = row["timestamp"]
        value = row["value"]
        hour = timestamp.hour
        hourly[hour] = value
    cur.close()
    conn.close()
    return hourly

def save_to_db(data):
    timestamps = data["timestamps"]
    values_map = data["values"]

    conn = get_connection()
    cur = conn.cursor()

    for tracker_id, value_list in values_map.items():
        for i, value in enumerate(value_list):
            if value is None:
                continue
            timestamp = timestamps[i]
            cur.execute("""
                INSERT INTO tracker_data (tracker_id, timestamp, value)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, (tracker_id, timestamp, value))

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Daten erfolgreich gespeichert!")

def fetch_gantner_data(tracker_ids, date, parameter):
    print(f"🌐 Starte API-Abruf für {parameter}: {tracker_ids}")
    site_id = 377  # Aasanurme

    # IDs extrahieren (z. B. 001 aus Aasanurme-001.Angle)
    tracker_indices = [tid.split("-")[1].split(".")[0] for tid in tracker_ids]
    param_list = [f"{parameter}_{i}" for i in tracker_indices]
    param_str = ",".join(param_list)

    url = f"{BASE_URL}/sites/{site_id}/data"
    params = {
        "type": "Tracker",
        "parameters": param_str,  # 👈 exakt, nicht Angle*
        "start": f"{date}T00:00:00",
        "end": f"{date}T23:59:59",
        "resolution": "1hour",
        "aggregation": "AVG"
    }

    response = requests.get(url, headers=HEADERS, params=params)
    print("🌐 Gantner Status:", response.status_code)
    response.raise_for_status()
    json_data = response.json()

    raw_data = json_data.get("data", [])

    if not raw_data:
        print("⚠️ Gantner API hat keine Daten geliefert.")
        return {
            "timestamps": [],
            "values": {tid: [None] * 24 for tid in tracker_ids}
        }

    # Timestamps parsen
    timestamps = []
    for row in raw_data:
        try:
            timestamps.append(datetime.fromisoformat(str(row[0])))
        except:
            timestamps.append(None)

    # Fallback-Zuordnung alphabetisch
    sorted_ids = sorted(tracker_ids)
    index_to_tracker = {
        idx: sorted_ids[idx - 1] for idx in range(1, len(sorted_ids) + 1)
    }
    print("✅ Fallback-Zuordnung:", index_to_tracker)

    values_map = {tid: [None] * 24 for tid in tracker_ids}

    for row in raw_data:
        try:
            hour = datetime.fromisoformat(str(row[0])).hour
        except:
            continue
        for idx in range(1, len(row)):
            tid = index_to_tracker.get(idx)
            if tid and hour < 24:
                values_map[tid][hour] = row[idx]

    return {
        "timestamps": timestamps,
        "values": values_map
    }