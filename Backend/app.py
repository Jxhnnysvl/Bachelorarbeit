from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from gantner_api import get_error_flag

app = Flask(__name__)
CORS(app)

# Mapping Anlagenname -> Site-ID
SITE_IDS = {
    "Aasanurme": 377,
    "Augusta": 320,
    "Babimost 2": 300,
    "Besingrand": 206,
    "Calarasi": 235
}

@app.route("/api/live-values")
def live_values():
    try:
        anlagen = request.args.getlist("anlagen")
        details = request.args.getlist("details")

        result = []

        for anlage in anlagen:
            site_id = SITE_IDS.get(anlage)
            if not site_id:
                continue

            for detail in details:
                if detail == "Error_Flags":
                    try:
                        wert = get_error_flag(site_id)
                        result.append({
                            "anlage": anlage,
                            "detail": detail,
                            "wert": wert,
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    except Exception as e:
                        result.append({
                            "anlage": anlage,
                            "detail": detail,
                            "error": str(e),
                            "wert": None
                        })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
