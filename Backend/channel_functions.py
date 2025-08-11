
def process_angle(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Angle"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]            
        full_id = f"{site}-{idx}.{label}"       

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_angle_diff(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Angle_Diff"  
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]                
        full_id = f"{site}-{idx}.{label}"           

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_chip_temp(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Chip_Temp"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val)
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_device_type(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Device_Type"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val == 3001:
                hourly_values[ts.hour] = 1
            elif val == 3012:
                hourly_values[ts.hour] = 2
            else:
                hourly_values[ts.hour] = None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_emergency_stop(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Emergency_Stop"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_emergency_switch(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Emergency_Switch"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_error_flags(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Error_Flags"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_firmware(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Firmware"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 2500
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_health_errors(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Health_Errors"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 2000
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_health_missed(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Health_Missed"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_last_angle(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Last_Angle"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = (float(val) + 60) / 24
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_meta_cleaning(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Meta_Cleaning"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_meta_monitoring(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Meta_Monitoring"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_meta_serial(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Meta_Serial"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 50
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_motor_current(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Motor_Current"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

def process_motor_current_max(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Motor_Current_Max"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_restarted(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Restarted"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) * 10
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_errors(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_Errors"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_hops(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_Hops"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 2
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_latency(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_Latency"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 10000
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_retries(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_Retries"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) * 10
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_rssi_dbm(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_RSSI_dBm"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = (float(val) + 110) / 15
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_time_ack(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_Time_Ack"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 1000
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_rf_time_answer(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Rf_Time_Answer"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 1000
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_set_angle(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Set_Angle"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_set_mode(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Set_Mode"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_set_motor_control(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Set_Motor_Control"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 100
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_stuck(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Stuck"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            hourly_values[ts.hour] = float(val) if val is not None else None

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_supply_voltage(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Supply_Voltage"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 12
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result


def process_uptime(date, site):
    from db import get_connection
    conn = get_connection()
    cur = conn.cursor()

    label = "Uptime"
    short_ids = [f"{label}-{i:03}" for i in range(1, 20)]
    result = {}

    for short_id in short_ids:
        idx = short_id.split("-")[1]
        full_id = f"{site}-{idx}.{label}"

        cur.execute("""
            SELECT timestamp, value
            FROM tracker_data
            WHERE tracker_id = %s AND site = %s AND DATE(timestamp) = %s
            ORDER BY timestamp ASC;
        """, (full_id, site, date))

        rows = cur.fetchall()
        hourly_values = [None] * 24
        for row in rows:
            ts = row["timestamp"]
            val = row["value"]
            if val is not None:
                val = float(val) / 15000
            hourly_values[ts.hour] = val

        result[short_id] = hourly_values

    cur.close()
    conn.close()
    return result

