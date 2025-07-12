import os
import requests
from dotenv import load_dotenv
from datetime import datetime

# .env einlesen
load_dotenv()

BASE_URL = os.getenv("API_BASE_URL")
TOKEN = os.getenv("API_TOKEN")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}"
}


# 📦 Geräte (Tracker) der Anlage holen
def get_device_ids(site_id: int) -> list:
    url = f"{BASE_URL}/sites/{site_id}/devices"
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    devices = res.json()
    # Optional Filter nach Typ
    return [d["id"] for d in devices if d["type"] == "Tracker"]


# 📡 Live-Daten von einem Device (für Battery_Voltage, Set_Angle, etc.)
def get_live_value_from_device(device_id: int, channel_name: str):
    url = f"{BASE_URL}/devices/{device_id}/channels/{channel_name}/live"
    res = requests.get(url, headers=HEADERS)
    res.raise_for_status()
    return res.json()["value"]


# 🧾 Tagesdaten (für Error_Flags via Site-Daten-Abfrage)
def get_error_flag(site_id: int):
    today = datetime.utcnow().date()
    start = f"{today}T00:00:00"
    end = f"{today}T23:59:59"

    url = f"{BASE_URL}/sites/{site_id}/data"
    params = {
        "type": "Tracker",
        "parameters": "Error_Flag*",
        "start": start,
        "end": end,
        "resolution": "1day"
    }

    res = requests.get(url, headers=HEADERS, params=params)
    res.raise_for_status()
    data = res.json()

    if data and data[0]["values"]:
        return data[0]["values"][0]["value"]
    return None
