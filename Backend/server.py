from flask import Flask, request, jsonify
from flask_cors import CORS
from Motor_Current_Max import process_motor_current_max

app = Flask(__name__)
CORS(app)

@app.route("/api/motor_current_max", methods=["GET"])
def api_motor_current_max():
    date = request.args.get("date") or "2025-07-15"
    try:
        result = process_motor_current_max(date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
