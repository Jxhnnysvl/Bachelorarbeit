def process_motor_current_max(date="2025-07-15"):
    from db import get_connection

    conn = get_connection()
    cur = conn.cursor()

    tracker_ids = [f"Motor_Current_Max-{i:03}" for i in range(1, 20)]
    result = {}  # KEINE timestamps mehr

    for tracker_id in tracker_ids:
        cur.execute("""
            SELECT value
            FROM tracker_data
            WHERE tracker_id = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (tracker_id, date))

        rows = cur.fetchall()
        values = [r["value"] for r in rows]

        # ggf. auffüllen falls weniger als 24
        while len(values) < 24:
            values.append(None)

        result[tracker_id] = values

    cur.close()
    conn.close()

    return result
