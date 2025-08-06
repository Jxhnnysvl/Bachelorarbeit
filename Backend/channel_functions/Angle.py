from gantner_api import (
    fetch_gantner_data,
    save_to_db,
    is_tracker_cached,
    load_tracker_from_db
)

def process_angle(tracker_ids, date, force_reload=False):
    print("↪️ process_angle() aufgerufen")

    result = {}
    to_fetch = []

    for tid in tracker_ids:
        # 🛑 Fallback-Schutz gegen fehlerhafte IDs wie "on"
        if not isinstance(tid, str) or "-" not in tid or "." not in tid:
            print(f"❌ Ungültige tracker_id übersprungen: {tid}")
            continue

        if not force_reload and is_tracker_cached(tid, date):
            result[tid] = load_tracker_from_db(tid, date)
        else:
            to_fetch.append(tid)

    if to_fetch:
        print(f"📡 Hole Gantner-Daten für: {to_fetch}")
        try:
            data = fetch_gantner_data(to_fetch, date, parameter="Angle")
            save_to_db(data)
            result.update(data["values"])
        except Exception as e:
            print(f"❌ Fehler beim Abrufen von Gantner-Daten: {e}")

    return result
