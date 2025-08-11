from channel_functions import (
    process_angle,
    process_angle_diff,
    process_chip_temp,
    process_device_type,
    process_emergency_stop,
    process_emergency_switch,
    process_error_flags,
    process_firmware,
    process_health_errors,
    process_health_missed,
    process_last_angle,
    process_meta_cleaning,
    process_meta_monitoring,
    process_meta_serial,
    process_motor_current,
    process_motor_current_max,
    process_restarted,
    process_rf_errors,
    process_rf_hops,
    process_rf_latency,
    process_rf_retries,
    process_rf_rssi_dbm,
    process_rf_time_ack,
    process_rf_time_answer,
    process_set_angle,
    process_set_mode,
    process_set_motor_control,
    process_stuck,
    process_supply_voltage,
    process_uptime
)

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
        "function": process_angle_diff,
        "scale": lambda v: ((v - 2.5) / 2) + 3 if v is not None else None
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
        "function": process_emergency_stop
    },
    "emergency_switch": {
        "label": "Emergency_Switch",
        "unit": "",
        "function": process_emergency_switch
    },
    "error_flags": {
        "label": "Error_Flags",
        "unit": "",
        "function": process_error_flags,
        "scale": lambda v: 3 if v and v > 0 else 0
    },
    "firmware": {
        "label": "Firmware",
        "unit": "",
        "function": process_firmware,
        "scale": lambda v: v / 2500  
    },
    "health_errors": {
        "label": "Health_Errors",
        "unit": "",
        "function": process_health_errors,
        "scale": lambda v: v / 2000
    },
    "health_missed": {
       "label": "Health_Missed",
       "unit": "",
      "function": process_health_missed,
      "scale": lambda v: v / 2000
    },
    "last_angle": {
        "label": "Last_Angle",
        "unit": "°",
        "function": process_last_angle,
        "scale": lambda v: (v + 60) / 24
    },
    "meta_cleaning": {
        "label": "Meta_Cleaning",
        "unit": "",
        "function": process_meta_cleaning
    },
    "meta_monitoring": {
        "label": "Meta_Monitoring",
        "unit": "",
        "function": process_meta_monitoring
    },
    "meta_serial": {
        "label": "Meta_Serial",
        "unit": "",
        "function": process_meta_serial,
        "scale": lambda v: v / 50
    },
    "motor_current": {
        "label": "Motor_Current",
        "unit": "A",
        "function": process_motor_current
    },
    "motor_current_max": {
        "label": "Motor_Current_Max",
        "unit": "A",
        "function": process_motor_current_max
    },
    "restarted": {
        "label": "Restarted",
        "unit": "",
        "function": process_restarted,
        "scale": lambda v: v * 10
    },
    "rf_errors": {
        "label": "Rf_Errors",
        "unit": "",
        "function": process_rf_errors
    },
    "rf_hops": {
        "label": "Rf_Hops",
        "unit": "",
        "function": process_rf_hops,
        "scale": lambda v: v / 2
    },
    "rf_latency": {
        "label": "Rf_Latency",
        "unit": "",
        "function": process_rf_latency,
        "scale": lambda v: v / 10000
    },
    "rf_retries": {
        "label": "Rf_Retries",
        "unit": "",
        "function": process_rf_retries,
        "scale": lambda v: v * 10
    },
    "rf_rssi_dbm": {
        "label": "Rf_RSSI_dBm",
        "unit": "dBm",
        "function": process_rf_rssi_dbm,
        "scale": lambda v: (v + 110) / 15
    },
    "rf_time_ack": {
        "label": "Rf_Time_Ack",
        "unit": "ms",
        "function": process_rf_time_ack,
        "scale": lambda v: v / 1000
    },
    "rf_time_answer": {
        "label": "Rf_Time_Answer",
        "unit": "ms",
        "function": process_rf_time_answer,
        "scale": lambda v: v / 1000
    },
    "set_angle": {
        "label": "Set_Angle",
        "unit": "°",
        "function": process_set_angle,
        "scale": lambda v: (v + 60) / 24
    },
    "set_mode": {
        "label": "Set_Mode",
        "unit": "",
        "function": process_set_mode
    },
    "set_motor_control": {
        "label": "Set_Motor_Control",
        "unit": "",
        "function": process_set_motor_control,
        "scale": lambda v: v / 100
    },
    "stuck": {
        "label": "Stuck",
        "unit": "",
        "function": process_stuck
    },
    "supply_voltage": {
        "label": "Supply_Voltage",
        "unit": "V",
        "function": process_supply_voltage,
        "scale": lambda v: v / 12
    },
    "uptime": {
        "label": "Uptime",
        "unit": "s",
        "function": process_uptime,
        "scale": lambda v: v / 15000
    },
}

