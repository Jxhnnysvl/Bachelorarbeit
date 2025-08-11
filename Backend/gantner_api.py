import os
import requests
from dotenv import load_dotenv
from datetime import datetime
from db import get_connection

load_dotenv(dotenv_path=".env")

BASE_URL = os.getenv("API_BASE_URL")
TOKEN = os.getenv("API_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}"
}

SITE_IDS = {
    "Aasanurme": 377,
    "Augusta": 320,
    "Augustenberg": 384,
    "Bavendorf": 354,
    "DeepTrack": 355,
    "Evapore": 467,
    "Geisenheim": 249,
    "Greenberry": 315,
    "Grong Grong": 256,
    "Hajdusamson": 239,
    "Innoagri": 263,
    "Pacentro": 277,
    "Paterno": 339,
    "Riva Presso Chieri": 322,
    "Salice": 281,
    "San Benigno": 242,
    "San Constanzo": 214,
    "Thiva": 212,
    "Tricerro": 392,
    "Veringenstadt": 409
}

SITE_ALIASES = {
    "San_Benigno": "San Benigno",
    "San_Constanzo": "San Constanzo",  
    "Riva_Presso_Chieri": "Riva Presso Chieri",
    "Grong_Grong": "Grong Grong"
}
def normalize_site_name(site):
    """Stellt sicher, dass site in SITE_IDS gefunden wird."""
    return SITE_ALIASES.get(site, site)

def is_tracker_cached(tracker_id, site, date):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) as count FROM tracker_data
        WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s;
    """, (tracker_id, site, date))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return False

    return row["count"] > 0

def load_tracker_from_db(tracker_id, site, date):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT timestamp, value FROM tracker_data
        WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
        ORDER BY timestamp ASC;
    """, (tracker_id, site, date))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    hourly = [None] * 24
    for row in rows:
        timestamp = row["timestamp"]
        value = row["value"]
        hour = timestamp.hour
        hourly[hour] = value
    return hourly

def save_to_db(payload, tracker_ids, _site_ignored):
    timestamps = payload["timestamps"]
    values = payload["values"]

    if isinstance(tracker_ids, set):
        tracker_ids = list(tracker_ids)
    elif isinstance(tracker_ids, dict):
        tracker_ids = list(tracker_ids.values())
    elif isinstance(tracker_ids, str):
        tracker_ids = [tracker_ids]

    conn = get_connection()
    cur = conn.cursor()

    for tracker_id, series in zip(tracker_ids, values):
        site_from_label = tracker_id.split("-", 1)[0]  
        for ts, val in zip(timestamps, series):
            if val is None:
                continue
            cur.execute("""
                INSERT INTO tracker_data (tracker_id, site, "timestamp", value)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT DO NOTHING;
            """, (tracker_id, site_from_label, ts, float(val)))

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Daten erfolgreich gespeichert!")

def fetch_and_save_selected(tracker_ids, date, site, force_reload=False):
    if not tracker_ids:
        return {}
    
    site = normalize_site_name(site)

    print("📦 Tracker:", tracker_ids)

    if not isinstance(tracker_ids, list):
        raise TypeError("❌ tracker_ids ist keine Liste!")

    param_map = {}
    for tid in tracker_ids:
        try:
            param = tid.split(".")[1]
            param_map.setdefault(param, []).append(tid)
        except Exception as e:
            print(f"❌ Fehler bei Parsing von {tid}: {e}")
            raise

    site_id = SITE_IDS.get(site)
    if site_id is None:
        raise ValueError(f"❌ Unbekannte site '{site}' - kein site_id-Mapping vorhanden")
    all_data = {}

    for param, ids_for_param in param_map.items():
        tracker_to_fetch = []
        for tid in ids_for_param:
            if not force_reload and is_tracker_cached(tid, site, date):
                print(f"✅ {tid} ist bereits in der DB - lade aus Cache")
                all_data[tid] = load_tracker_from_db(tid, site, date)
            else:
                tracker_to_fetch.append(tid)

        if not tracker_to_fetch:
            continue

        original_ids_for_param = {
            int(t.split("-")[1].split(".")[0]): t
            for t in tracker_to_fetch if t.endswith(f".{param}")
        }

        param_string = f"{param}*"
        url = f"{BASE_URL}/sites/{site_id}/data"
        params = {
            "type": "Tracker",
            "parameters": param_string,
            "start": f"{date}T00:00:00",
            "end": f"{date}T23:59:59",
            "resolution": "1hour",
            "aggregation": "AVG"
        }

        try:
            print(f"\n📡 Anfrage an Gantner für Param: {param_string}")
            res = requests.get(url, headers=HEADERS, params=params)
            res.raise_for_status()

            json_data = res.json()
            data_raw = json_data.get("data", [])
            if not data_raw or not isinstance(data_raw[0], list):
                print("❌ Ungültiges Format: data[0] ist keine Liste")
                continue
            
            columns = data_raw[0]     
            raw_data = data_raw[1:]  

            if not raw_data:
                print(f"⚠️ Keine gültigen Daten für {param_string}")
                continue

            index_to_tracker = {}

            for idx, col in enumerate(columns):
                if idx == 0:
                    continue
                
                name = col.get("name")
                if not name or not name.endswith(f".{param}"):
                    continue  
                
                try:
                    if "-" in name:
                        site_prefix, rest = name.split("-", 1)
                        if site_prefix.startswith("R") and site_prefix[1:].isdigit():
                            index = site_prefix[1:].zfill(3)
                            param = rest.split(".")[1]
                            site_from_col = "Bavendorf"
                            tracker_id = f"{site_from_col}-{index}.{param}"
                        else:
                            index, param = rest.split(".", 1)
                            site_from_col = site_prefix
                            tracker_id = f"{site_from_col}-{index}.{param}"

                        if tracker_id in tracker_to_fetch:
                            index_to_tracker[idx] = tracker_id
                            print(f"✅ Mapping: Spalte {idx} → {tracker_id}")
                except Exception as e:
                    print(f"❌ Fehler beim Parsen von Spalte {idx} ({name}): {e}")
                
            if not index_to_tracker:
            
                sorted_tracker_ids = sorted(original_ids_for_param.values())
                for idx in range(1, len(columns)):
                    tracker_id = sorted_tracker_ids[idx - 1] if idx - 1 < len(sorted_tracker_ids) else None
                    if tracker_id:
                        index_to_tracker[idx] = tracker_id
                        print(f"✅ Fallback: Spalte {idx} → {tracker_id}")

            timestamps = []
            filtered_data = []
            for row in raw_data:
                timestamp_raw = row[0]
                if isinstance(timestamp_raw, dict):
                    continue
                if not isinstance(timestamp_raw, str):
                    timestamp_raw = str(timestamp_raw)
                try:
                    ts = datetime.fromisoformat(timestamp_raw)
                    timestamps.append(ts.isoformat())
                    filtered_data.append(row)
                except Exception as e:
                    continue

            tracker_to_values = {tid: [None] * len(timestamps) for tid in index_to_tracker.values()}
            for row_idx, row in enumerate(filtered_data):
                for col_idx, value in enumerate(row):
                    if col_idx == 0:
                        continue
                    tracker_id = index_to_tracker.get(col_idx)
                    if tracker_id:
                        tracker_to_values[tracker_id][row_idx] = value

            final_tracker_ids = list(tracker_to_values.keys())
            final_tracker_values = list(tracker_to_values.values())

            print("🧩 Zu speichernde Tracker/Werte:")
            for tid, val in zip(final_tracker_ids, final_tracker_values):
                print(f"  {tid} → {len([v for v in val if v is not None])} Werte")

            if force_reload and final_tracker_ids:
                delete_day_for_trackers(final_tracker_ids, site, date)

            save_to_db({
                "timestamps": timestamps,
                "values": final_tracker_values
            }, final_tracker_ids, site)

            for tracker_id, values in tracker_to_values.items():
                all_data[tracker_id] = values

        except Exception as e:
            print(f"❌ Fehler bei Request für {param_string}: {e}")
            raise

    print("\n📦 Daten werden ans Frontend zurückgegeben:")
    for key, values in all_data.items():
        print(f"{key}: {values[:3]}... ({len(values)} Werte)")

    return all_data

def delete_day_for_trackers(tracker_ids, site, date):
    if not tracker_ids:
        return
    conn = get_connection()
    cur = conn.cursor()
    for tid in tracker_ids:
        cur.execute("""
            DELETE FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE("timestamp") = %s;
        """, (tid, site, date))
    conn.commit()
    cur.close()
    conn.close()
    print(f"Deleted existing rows for {len(tracker_ids)} tracker(s) on {date} @ {site}")


