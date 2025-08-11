from flask import Flask, request, jsonify
from flask_cors import CORS
from gantner_api import fetch_and_save_selected
from channels import channel_definitions
from datetime import datetime
from flask import send_file
import io, zipfile, csv
from datetime import timedelta

TRACKER_COUNTS = {
    "Aasanurme": 19,
    "Augusta": 25,
    "Augustenberg": 24,
    "Bavendorf": 18,
    "DeepTrack": 9,
    "Evapore": 8,
    "Geisenheim": 12,
    "Greenberry": 40,
    "Grong Grong": 38,
    "Hajdusamson": 20,
    "Innoagri": 20,
    "Pacentro": 32,
    "Paterno": 33,
    "Riva Presso Chieri": 35,
    "Salice": 31,
    "San_Benigno": 27,
    "San Constanzo": 26,
    "Thiva": 32,
    "Tricerro": 26,
    "Veringenstadt": 34
}

app = Flask(__name__)
CORS(app)

def make_endpoint(func, name):
    def endpoint():
        date = request.args.get("date") or datetime.today().date().isoformat()
        site = request.args.get("site")
        if not site:
            return jsonify({"error": "site is required"}), 400

        try:
            force_flag = request.args.get("force", "").lower() in ("1", "true", "yes")

            tracker_param = request.args.get("trackers", "")  
            if tracker_param:
                tracker_ids = [t.strip() for t in tracker_param.split(",") if t.strip()]
                if tracker_ids:
                    tracker_ids = [t for t in tracker_ids if t.startswith(f"{site}-")]

                    cfg = channel_definitions.get(name, {})
                    label = cfg.get("label")  
                    if label:
                        tracker_ids = [t for t in tracker_ids if t.endswith(f".{label}")]

                    fetch_and_save_selected(
                        tracker_ids, date, site,
                        force_reload=force_flag  
                    )

            return jsonify(func(date, site))
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

    endpoint.__name__ = f"endpoint_{name}"
    return endpoint

for route, config in channel_definitions.items():
    if config.get("function"):
        app.route(f"/api/{route}", methods=["GET"])(make_endpoint(config["function"], route))

@app.route("/api/data", methods=["POST"])
def api_data():
    body = request.get_json()
    trackers = body.get("trackers", [])
    date = body.get("date")
    force_reload = body.get("forceReload", False)
    site = body.get("site")  

    if not trackers or not date or not site:
        return jsonify({"error": "trackers, date and site required"}), 400

    try:
        result = fetch_and_save_selected(trackers, date, site, force_reload=force_reload)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/multiple_download", methods=["POST"])
def multiple_download():
    try:
        data = request.get_json()
        sites = data.get("sites", [])
        channels = data.get("channels", [])
        start_date = data.get("start_date")
        end_date = data.get("end_date")

        if not sites or not channels or not start_date or not end_date:
            return jsonify({"error": "Sites, Channels, Start- und Enddatum sind erforderlich"}), 400

        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, "w", zipfile.ZIP_DEFLATED) as zf:
            for site in sites:
                tracker_max = TRACKER_COUNTS.get(site, 20)

                for channel in channels:
                    current_date = datetime.fromisoformat(start_date)
                    end_dt = datetime.fromisoformat(end_date)

                    while current_date <= end_dt:
                        date_str = current_date.date().isoformat()

                        tracker_ids = [f"{site}-{i:03}.{channel}" for i in range(1, tracker_max + 1)]
                        all_data = fetch_and_save_selected(tracker_ids, date_str, site, force_reload=False)

                        header = ["Tag", "Uhrzeit"] + [f"{site}-{i:03}.{channel}" for i in range(1, tracker_max + 1)]

                        csv_buffer = io.StringIO()
                        writer = csv.writer(csv_buffer, delimiter=";") 
                        writer.writerow(header)

                        for hour in range(24):
                            row_date = date_str
                            row_time = f"{hour:02}:00" 

                            row_values = []
                            for i in range(1, tracker_max + 1):
                                tid = f"{site}-{i:03}.{channel}"
                                series = all_data.get(tid)

                                val_out = ""
                                if isinstance(series, list) and hour < len(series):
                                    v = series[hour]
                                    if v is not None:
                                        if isinstance(v, (int, float)):
                                            val_out = str(v).replace(".", ",")
                                        else:
                                            val_out = str(v)
                                row_values.append(val_out)

                            writer.writerow([row_date, row_time] + row_values)

                        file_name = f"{site}_{channel}_{date_str}.csv"
                        zf.writestr(file_name, csv_buffer.getvalue())
                        current_date += timedelta(days=1)

        memory_file.seek(0)
        return send_file(
            memory_file,
            mimetype="application/zip",
            as_attachment=True,
            download_name=f"multiple_download_{start_date}_bis_{end_date}.zip"
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)

