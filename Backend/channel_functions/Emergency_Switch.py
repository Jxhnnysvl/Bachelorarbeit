def process_emergency_switch(date):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    tracker_ids = [f"Emergency_Switch-{i:03}" for i in range(1, 20)]
    result = {}

    for tracker_id in tracker_ids:
        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (tracker_id, date))
        rows = cur.fetchall()

        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[tracker_id] = hourly_values

    cur.close()
    conn.close()
    return result
