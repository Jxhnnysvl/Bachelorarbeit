from flask import Flask, request, jsonify
from flask_cors import CORS

from gantner_api import fetch_and_save_selected

# Importiere Channel-Funktionen
from channel_functions.Angle import process_angle
from channel_functions.Chip_Temp import process_chip_temp

# Importiere zentrale Channel-Definitionen
from channels import channel_definitions

from datetime import datetime

app = Flask(__name__)
CORS(app)

# 🔁 Automatisch API-Endpunkte aus channel_definitions erzeugen
def make_endpoint(func, name):
    def endpoint():
        date = request.args.get("date") or datetime.today().date().isoformat()
        try:
            return jsonify(func(date))
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    endpoint.__name__ = f"endpoint_{name}"  # ✨ wichtig für Flask!
    return endpoint

for route, config in channel_definitions.items():
    if config.get("function"):
        app.route(f"/api/{route}", methods=["GET"])(make_endpoint(config["function"], route))

# 🔧 POST-Route für dynamische Tracker-Daten aus dem Frontend
@app.route("/api/data", methods=["POST"])
def api_data():
    body = request.get_json()
    trackers = body.get("trackers", [])
    date = body.get("date")
    force_reload = body.get("forceReload", False)

    if not trackers or not date:
        return jsonify({"error": "trackers and date required"}), 400

    try:
        result = fetch_and_save_selected(trackers, date, force_reload=force_reload)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

