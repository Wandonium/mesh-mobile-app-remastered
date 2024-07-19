export const CMD_DEVICE_TURN_OFF = [161, 1, 0]
export const CMD_DEVICE_TURN_ON = [161, 1, 1]

export const CMD_CHECK_ENABLED = [166, 0] // 0xa600

export const CMD_DORMANT_MODE_ENABLE = [162, 2, 6, 64] // 'ogIGQA==' // 0xa2020640
export const CMD_DORMANT_MODE_DISABLE = [162, 2, 12, 128] // 'ogIMgA==' // 0xa2020c80

export const CMD_CHECK_FIRMWARE_VERSION = [86]
export const CMD_CHECK_HARDWARE_VERSION = [72]
export const CMD_START_FIRMWARE_OTA = [196]

export const CMD_READ_CONFIG = [195]
export const CMD_SET_BOOTMODE = [194, 2]
export const CMD_SET_BATTERY_PACK = [80]
export const CMD_SET_PV_MODE = [198]

export const CMD_DEBUG_MODE_START = [199]
export const CMD_DEBUG_MODE_END = [200]

export const CMD_RESET_NRF = [203]
export const CMD_BLE_DISCONNECT = [221]

export const CMD_CHANGE_ADDRESS_HEADER = 'B'

export const CMD_BLE_HS_PW = 'UEFTU1dPUkQ='
