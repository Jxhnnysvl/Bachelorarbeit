import os
import requests
from dotenv import load_dotenv
from db import get_connection
from Motor_Current_Max import process_motor_current_max  # weitere Module hier einfügen

# Lade .env Variablen (API_URL und TOKEN)
load_dotenv()
BASE_URL = os.getenv("API_BASE_URL")
TOKEN = os.getenv("API_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}"
}

def get_motor_data_per_hour(site_id: int, date: str):
    """
    Holt Motor_Current_Max-Daten im Stundentakt als Matrix (inkl. Timestamp + Tracker-Werten).
    """
    url = f"{BASE_URL}/sites/{site_id}/data"
    params = {
        "type": "Tracker",
        "parameters": "Motor_Current_Max*",
        "start": f"{date}T00:00:00",
        "end": f"{date}T23:59:59",
        "resolution": "1hour"
    }

    res = requests.get(url, headers=HEADERS, params=params)
    print("📡 URL-Request:", res.url)
    res.raise_for_status()
    raw_data = res.json()

    data_matrix = raw_data.get("data")
    if not data_matrix or not isinstance(data_matrix, list):
        print("❌ Keine oder ungültige Datenmatrix!")
        return None

    print("📦 Anzahl Datenzeilen:", len(data_matrix))

    # Extrahiere Timestamps (erste Spalte)
    timestamps = [row[0] for row in data_matrix if isinstance(row, list) and len(row) > 1]

    # Extrahiere Trackerwerte (alle Spalten außer der ersten)
    values = list(zip(*[row[1:] for row in data_matrix if isinstance(row, list) and len(row) > 1]))

    print("🕒 Anzahl Zeitpunkte:", len(timestamps))
    print("🔧 Anzahl Tracker:", len(values))

    return {
        "timestamps": timestamps,
        "values": [list(col) for col in values]
    }

def save_to_db(data, parameter_name="Motor_Current_Max"):
    """
    Speichert die Tracker-Daten mit Timestamps in die PostgreSQL-Datenbank.
    """
    conn = get_connection()
    cur = conn.cursor()

    timestamps = data["timestamps"]
    values = data["values"]

    for tracker_index, tracker_values in enumerate(values, start=1):
        tracker_id = f"{parameter_name}-{tracker_index:03}"

        for i, value in enumerate(tracker_values):
            timestamp = timestamps[i]

            # Falls der Wert ein dict ist, extrahiere den echten float-Wert
            if isinstance(value, dict):
                value = value.get("value")

            if value is None:
                continue  # überspringe fehlende Werte
            
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


if __name__ == "__main__":
    from datetime import datetime, timedelta
    SITE_ID = 377

    start_date = datetime.strptime("2025-07-18", "%Y-%m-%d")
    end_date = datetime.strptime("2025-07-011", "%Y-%m-%d")

    current_date = start_date

    while current_date >= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        print(f"\n📅 === {date_str} ===")

        data = get_motor_data_per_hour(SITE_ID, date_str)

        if data and data.get("timestamps") and data.get("values"):
            save_to_db(data)
            process_motor_current_max(date_str)
        else:
            print("⚠️ Keine gültigen Daten empfangen.")

        current_date -= timedelta(days=1)
