from channel_functions.Angle import process_angle
from channel_functions.Chip_Temp import process_chip_temp
from channel_functions.Device_Type import process_device_type

channel_definitions = {
    "angle": {
        "label": "Angle",
        "unit": "°",
        "function": process_angle,
        "scale": lambda v: (v + 60) / 24
    },
    "angle_diff": {
        "label": "Angle_Diff",
        "unit": "°",
        "function": None
    },
    "chip_temp": {
        "label": "Chip_Temp",
        "unit": "°C",
        "function": process_chip_temp,
        "scale": lambda v: v / 8
    },
        "device_type": {
        "label": "Device_Type",
        "unit": "",
        "function": process_device_type
    },
    "emergency_stop": {
        "label": "Emergency_Stop",
        "unit": "",
        "function": None
    },
    "emergency_switch": {
        "label": "Emergency_Switch",
        "unit": "",
        "function": None
    },
    "error_flags": {
        "label": "Error_Flags",
        "unit": "",
        "function": None
    },
    "firmware": {
        "label": "Firmware",
        "unit": "",
        "function": None
    },
    "health_errors": {
        "label": "Health_Errors",
        "unit": "",
        "function": None
    },
    "health_missed": {
        "label": "Health_Missed",
        "unit": "",
        "function": None
    },
    "last_angle": {
        "label": "Last_Angle",
        "unit": "°",
        "function": None
    },
    "meta_cleaning": {
        "label": "Meta_Cleaning",
        "unit": "",
        "function": None
    },
    "meta_monitoring": {
        "label": "Meta_Monitoring",
        "unit": "",
        "function": None
    },
    "meta_serial": {
        "label": "Meta_Serial",
        "unit": "",
        "function": None
    },
    "motor_current": {
        "label": "Motor_Current",
        "unit": "A",
        "function": None
    },
    "motor_current_max": {
        "label": "Motor_Current_Max",
        "unit": "A",
        "function": None  # <- Ergänzen, sobald Funktion fertig
    },
    "restarted": {
        "label": "Restarted",
        "unit": "",
        "function": None
    },
    "rf_errors": {
        "label": "Rf_Errors",
        "unit": "",
        "function": None
    },
    "rf_hops": {
        "label": "Rf_Hops",
        "unit": "",
        "function": None
    },
    "rf_latency": {
        "label": "Rf_Latency",
        "unit": "",
        "function": None
    },
    "rf_retries": {
        "label": "Rf_Retries",
        "unit": "",
        "function": None
    },
    "rf_rssi_dbm": {
        "label": "Rf_RSSI_dBm",
        "unit": "dBm",
        "function": None
    },
    "rf_time_ack": {
        "label": "Rf_Time_Ack",
        "unit": "ms",
        "function": None
    },
    "rf_time_answer": {
        "label": "Rf_Time_Answer",
        "unit": "ms",
        "function": None
    },
    "set_angle": {
        "label": "Set_Angle",
        "unit": "°",
        "function": None
    },
    "set_mode": {
        "label": "Set_Mode",
        "unit": "",
        "function": None
    },
    "set_motor_control": {
        "label": "Set_Motor_Control",
        "unit": "",
        "function": None
    },
    "stuck": {
        "label": "Stuck",
        "unit": "",
        "function": None
    },
    "supply_voltage": {
        "label": "Supply_Voltage",
        "unit": "V",
        "function": None
    },
    "uptime": {
        "label": "Uptime",
        "unit": "s",
        "function": None
    }
}

