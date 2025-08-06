from collections import defaultdict
from channels import channel_definitions

def fetch_and_save_selected(tracker_ids, date, force_reload=False):
    grouped = defaultdict(list)

    for tid in tracker_ids:
        # 🛡 Schutz vor "on", "true", undefined etc.
        if not isinstance(tid, str) or "-" not in tid or "." not in tid:
            print(f"❌ Ungültige tracker_id übersprungen: {tid}")
            continue

        try:
            _, rest = tid.split("-", 1)
            _, param = rest.split(".", 1)
            grouped[param.lower()].append(tid)
        except Exception as e:
            print(f"❌ Fehler beim Zerlegen von {tid}: {e}")
            continue

    result = {}

    for param, tracker_list in grouped.items():
        definition = channel_definitions.get(param.lower())

        if not definition:
            print(f"⚠️ Kein Eintrag in channel_definitions für '{param}'")
            continue

        handler = definition.get("function")
        if not handler:
            print(f"⏭️ Kein Handler für '{param}'")
            continue

        try:
            print(f"📥 Starte Verarbeitung von {param} ({len(tracker_list)} Tracker)")
            result.update(handler(tracker_list, date, force_reload))
        except Exception as e:
            print(f"❌ Fehler im Handler für '{param}': {e}")

    return result
