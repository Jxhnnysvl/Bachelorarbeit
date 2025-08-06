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
   """, (tracker_id, date))
   row = cur.fetchone()
   count = list(row.values())[0] if row else 0
   cur.close()
   conn.close()
   return count > 0
 
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
 
def save_to_db(data, tracker_ids):
   conn = get_connection()
   cur = conn.cursor()
 
   timestamps = data["timestamps"]
   values = data["values"]
 
   for tracker_index, tracker_values in enumerate(values):
       if tracker_index >= len(tracker_ids):
           print(f"⚠️ Überspringe Index {tracker_index}: Keine passende tracker_id")
           continue
       tracker_id = tracker_ids[tracker_index]
 
       for i, value in enumerate(tracker_values):
           timestamp = timestamps[i]
 
           if isinstance(value, dict):
               value = value.get("value")
           if value is None:
               continue
 
           print(f"🧪 Tracker: {tracker_id}, Zeit: {timestamp}, Wert: {value}, Typ: {type(value)}")
 
           cur.execute("""
               INSERT INTO tracker_data (tracker_id, timestamp, value)
               VALUES (%s, %s, %s)
               ON CONFLICT DO NOTHING;
           """, (tracker_id, timestamp, value))
 
   conn.commit()
   cur.close()
   conn.close()
   print("✅ Daten erfolgreich gespeichert!")
 
def fetch_and_save_selected(tracker_ids, date, force_reload=False):
   if not tracker_ids:
       return {}
 
   print("\n📥 Starte fetch_and_save_selected() für", date)
   print("🔁 forceReload:", force_reload)
   print("📦 Tracker:", tracker_ids)
 
   if not isinstance(tracker_ids, list):
       raise TypeError("❌ tracker_ids ist keine Liste!")
 
   grouped = {}
   for tid in tracker_ids:
       try:
           site_and_index, param = tid.split(".")
           index = site_and_index.split("-")[1]
           grouped.setdefault(param, []).append(int(index))
       except Exception as e:
           print(f"❌ Fehler bei Parsing von {tid}: {e}")
           raise
 
   site_id = 377
   all_data = {}
 
   for param, indices in grouped.items():
       print(f"\n🔍 Bearbeite Param: {param} mit Indizes: {indices}")
 
       original_ids_for_param = {
           int(t.split("-")[1].split(".")[0]): t
           for t in tracker_ids if t.endswith(f".{param}")
       }
 
       cached_indices = []
       for i in indices:
           tracker_id = original_ids_for_param.get(i)
           if tracker_id and not force_reload and is_tracker_cached(tracker_id, date):
               print(f"✅ {tracker_id} ist bereits in der DB – lade aus Cache")
               all_data[tracker_id] = load_tracker_from_db(tracker_id, date)
               cached_indices.append(i)
 
       missing_indices = [i for i in indices if i not in cached_indices]
       if not missing_indices:
           print(f"⏭️ Alle {param}-Tracker bereits vorhanden – überspringe API")
           continue
 
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
           print("🔗 URL:", url)
           print("📄 PARAMS:", params)
           res = requests.get(url, headers=HEADERS, params=params)
           print("🌐 Gantner-Response Status:", res.status_code)
           res.raise_for_status()
 
           json_data = res.json()
           raw_data = json_data.get("data", [])
           columns = json_data.get("columns", [])
           print("📋 Columns:", columns)
 
           if not raw_data:
               print(f"⚠️ Keine gültigen Daten für {param_string}")
               continue
           print("🧾 Antwort-Vorschau (erste Zeile):", raw_data[:1])
 
           index_to_tracker = {}
 
           # 🔍 Robustes Mapping aus 'columns'
           for idx, col in enumerate(columns):
               if idx == 0:
                   continue
 
               name = col.get("name")
 
               if not name and col.get("location") and col.get("parameter"):
                   location = col["location"]
                   parameter = col["parameter"]
                   parts = location.split(".")
                   if len(parts) >= 3:
                       site = parts[2]
                       site_name = site[:-3]
                       index = site[-3:]
                       name = f"{site_name}-{index}.{parameter}"
 
               if name:
                   for full_id in tracker_ids:
                       if name == full_id:
                           index_to_tracker[idx] = full_id
                           break
 
           # 🔁 Fallback-Mapping wenn Spaltennamen nicht erkennbar
           if not index_to_tracker:
               print("⚠️ Kein column-Mapping möglich – fallback über alphabetisch sortierte IDs")
               sorted_tracker_ids = sorted([
                   original_ids_for_param.get(i)
                   for i in missing_indices
                   if original_ids_for_param.get(i)
               ])
               for idx in range(1, len(raw_data[0])):
                   tracker_id = sorted_tracker_ids[idx - 1] if idx - 1 < len(sorted_tracker_ids) else None
                   if tracker_id:
                       index_to_tracker[idx] = tracker_id
                       print(f"✅ Fallback: Spalte {idx} → {tracker_id}")
 
           timestamps = []
           filtered_data = []
           for row in raw_data:
               timestamp_raw = row[0]
               if isinstance(timestamp_raw, dict):
                   print("⚠️ Unerwartetes Format in row[0]:", timestamp_raw)
                   continue
               if not isinstance(timestamp_raw, str):
                   timestamp_raw = str(timestamp_raw)
               try:
                   ts = datetime.fromisoformat(timestamp_raw)
                   timestamps.append(ts.isoformat())
                   filtered_data.append(row)
               except Exception as e:
                   print("❌ Fehler beim Umwandeln von timestamp:", timestamp_raw, e)
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
 
           save_to_db({
               "timestamps": timestamps,
               "values": final_tracker_values
           }, final_tracker_ids)
 
           for tracker_id, values in tracker_to_values.items():
               all_data[tracker_id] = values
 
       except Exception as e:
           print(f"❌ Fehler bei Request für {param_string}: {e}")
           raise
 
   print("\n📦 Daten werden ans Frontend zurückgegeben:")
   for key, values in all_data.items():
       print(f"{key}: {values[:3]}... ({len(values)} Werte)")
 
   return all_data