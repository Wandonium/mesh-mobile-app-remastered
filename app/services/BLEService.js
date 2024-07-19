import { stringToBytes } from 'convert-string'
import { NativeEventEmitter, NativeModules, Platform } from 'react-native'
import BleManager from 'react-native-ble-manager'
import {
  CMD_BLE_HS_PW,
  CMD_CHANGE_ADDRESS_HEADER,
  CMD_CHECK_ENABLED,
  CMD_CHECK_HARDWARE_VERSION,
  CMD_CHECK_FIRMWARE_VERSION,
  CMD_DEVICE_TURN_OFF,
  CMD_DEVICE_TURN_ON,
  CMD_DORMANT_MODE_DISABLE,
  CMD_DORMANT_MODE_ENABLE,
  CMD_START_FIRMWARE_OTA,
  CMD_READ_CONFIG,
  CMD_SET_BOOTMODE,
  CMD_SET_BATTERY_PACK,
  CMD_SET_PV_MODE,
  CMD_DEBUG_MODE_START,
  CMD_DEBUG_MODE_END,
  CMD_RESET_NRF,
  CMD_BLE_DISCONNECT
} from '../constants/bleUARTCommands'

const BleManagerModule = NativeModules.BleManager
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule)

export const BLE_UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
export const BLE_UART_WRITE_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'
export const BLE_UART_READ_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'

export const BLE_BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb'
export const BLE_BATTERY_UPDATE_UUID = '00002a19-0000-1000-8000-00805f9b34fb'

export const BLE_UART_SERVICE_UUID_IOS = '6E400001-B5A3-F393-E0A9-E50E24DCCA9E'
export const BLE_UART_WRITE_UUID_IOS = '6E400002-B5A3-F393-E0A9-E50E24DCCA9E'
export const BLE_UART_READ_UUID_IOS = '6E400003-B5A3-F393-E0A9-E50E24DCCA9E'

export const BLE_BATTERY_SERVICE_UUID_IOS = '0000180F-0000-1000-8000-00805F9B34FB'
export const BLE_BATTERY_SERVICE_UUID_2_IOS = '180F'
export const BLE_BATTERY_UPDATE_UUID_IOS = '00002A19-0000-1000-8000-00805F9B34FB'
export const BLE_BATTERY_UPDATE_UUID_2_IOS = '2A19'

export default class BLEService {
  static BleManager = BleManager

  static BleManagerModule = BleManagerModule

  static bleManagerEmitter = bleManagerEmitter

  static enableBluetooth() {
    return BleManager.enableBluetooth()
  }

  static forceEnableBluetooth() {
    return BleManager.birdEnableBluetooth()
  }

  static forceDisableBluetooth() {
    // return BleManager.disableBluetooth()
  }

  static startBleManager() {
    return BleManager.start({ showAlert: true })
  }

  static requestConnectionPriority(id) {
    return BleManager.requestConnectionPriority(id, 1)
  }

  static checkBleState() {
    return BleManager.checkState()
  }

  static startScan() {
    return BleManager.scan([], 5, true, {scanMode: 2})
  }

  static stopScan() {
    return BleManager.stopScan()
  }

  static reConnect() {
    if (Platform.OS === 'android') {
      return BleManager.getConnectedPeripherals([BLE_UART_SERVICE_UUID, BLE_BATTERY_SERVICE_UUID])
    } else {
      return BleManager.getConnectedPeripherals([BLE_UART_SERVICE_UUID_IOS, BLE_BATTERY_SERVICE_UUID_2_IOS])
    }
  }

  static connectDevice(id) {
    return BleManager.connect(id)
  }

  static disconnectDevice(id) {
    return BleManager.disconnect(id, true)
  }

  static writeWithoutResponse(id, service, characteristic, data, size) {
    return BleManager.writeWithoutResponse(id, service, characteristic, data, size)
  }

  static read(device) {
    if (Platform.OS === 'android') {
      return BleManager.read(device.id, BLE_UART_SERVICE_UUID, BLE_UART_READ_UUID)
    } else {
      return BleManager.read(device.id, BLE_UART_SERVICE_UUID_IOS, BLE_UART_READ_UUID_IOS)
    }
  }

  static readBattery(device) {
    if (Platform.OS === 'android') {
      return BleManager.read(device.id, BLE_BATTERY_SERVICE_UUID, BLE_BATTERY_UPDATE_UUID)
    } else {
      return BleManager.read(device.id, BLE_BATTERY_SERVICE_UUID_2_IOS, BLE_BATTERY_UPDATE_UUID_2_IOS)
    }
  }

  static sendCommandWithoutResponse(device, command) {
    if (Platform.OS === 'android') {
      console.log('[BLEService.js] - sendCommandWithoutResponse', command)
      return this.writeWithoutResponse(device.id, BLE_UART_SERVICE_UUID, BLE_UART_WRITE_UUID, command)
    } else {
      return this.writeWithoutResponse(device.id, BLE_UART_SERVICE_UUID_IOS, BLE_UART_WRITE_UUID_IOS, command)
    }
  }

  static stopBleManager() {
    return BleManager.stop()
  }

  static retrieveServices(id) {
    return BleManager.retrieveServices(id)
  }

  static startNotification(id, service, characteristic) {
    return BleManager.startNotification(id, service, characteristic)
  }

  static stopNotification(id, service, characteristic) {
    return BleManager.stopNotification(id, service, characteristic)
  }

  static removePeripheral(id) {
    return BleManager.removePeripheral(id)
  }

  static removeBond(id) {
    return BleManager.removeBond(id)
  }

  static getConnectedPeripherals() {
    return BleManager.getConnectedPeripherals([])
  }

  static getBondedPeripherals() {
    return BleManager.getBondedPeripherals([])
  }

  static checkEnabled(device) {
    return this.sendCommandWithoutResponse(device, CMD_CHECK_ENABLED)
  }

  static turnOffDevice(device) {
    return this.sendCommandWithoutResponse(device, CMD_DEVICE_TURN_OFF)
  }

  static turnOnDevice(device) {
    return this.sendCommandWithoutResponse(device, CMD_DEVICE_TURN_ON)
  }

  static enableDormantMode(device) {
    return this.sendCommandWithoutResponse(device, CMD_DORMANT_MODE_ENABLE)
  }

  static disableDormantMode(device) {
    return this.sendCommandWithoutResponse(device, CMD_DORMANT_MODE_DISABLE)
  }

  static checkHardwareVersion(device) {
    return this.sendCommandWithoutResponse(device, CMD_CHECK_HARDWARE_VERSION)
  }

  static checkFirmwareVersion(device) {
    return this.sendCommandWithoutResponse(device, CMD_CHECK_FIRMWARE_VERSION)
  }

  static startOTA(device) {
    return this.sendCommandWithoutResponse(device, CMD_START_FIRMWARE_OTA)
  }

  static changeAddress(device, address) {
    return this.sendCommandWithoutResponse(device, stringToBytes(CMD_CHANGE_ADDRESS_HEADER + address))
  }

  static sendBLEPassword(device) {
    return this.sendCommandWithoutResponse(device, CMD_BLE_HS_PW)
  }

  static readConfig(device) {
    return this.sendCommandWithoutResponse(device, CMD_READ_CONFIG)
  }

  static setBootMode(device, bootmode) {
    return this.sendCommandWithoutResponse(device, CMD_SET_BOOTMODE.concat(bootmode))
  }

  static setBatteryPack(device, option) {
    return this.sendCommandWithoutResponse(device, CMD_SET_BATTERY_PACK.concat(option))
  }

  static setPVMode(device, pvMode) {
    return this.sendCommandWithoutResponse(device, CMD_SET_PV_MODE.concat(pvMode))
  }

  static startDebugMode(device) {
    return this.sendCommandWithoutResponse(device, CMD_DEBUG_MODE_START)
  }

  static stopDebugMode(device) {
    return this.sendCommandWithoutResponse(device, CMD_DEBUG_MODE_END)
  }

  static resetNRF(device) {
    return this.sendCommandWithoutResponse(device, CMD_RESET_NRF)
  }

  static nrfDisconnectBle(device) {
    return this.sendCommandWithoutResponse(device, CMD_BLE_DISCONNECT)
  }
}
