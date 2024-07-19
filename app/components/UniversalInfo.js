import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { getDischargeEstim } from '../services'
import { WiFi, Battery, User, Throughput, Lock } from './svg'

const getEstim = value => getDischargeEstim(parseInt(value, 10) > 4 ? 45 * 60 * (parseInt(value, 10) - 4) : 0)

export default function({
  type,
  clients,
  active_ap,
  total_ap,
  gateways_download_rate,
  gateways_upload_rate,
  downloadRate,
  uploadRate,
  security,
  battery = 0,
  bluetoothBattery,
}) {
  //console.log('[UniversalInfo.js] - battery', bluetoothBattery)
  return (
    <View style={[styles.info, type !== 'ssid' ? { justifyContent: 'space-between' } : null]}>
      {type !== 'ssid' && (
        <View style={[styles.section, { width: '40%' }]}>
          {type === 'node' ? <Battery percent={bluetoothBattery || battery} /> : <WiFi />}
          <Text style={styles.text} numberOfLines={1}>
            {(bluetoothBattery > 0 || battery > 0) ? type === 'node'
                ? `${bluetoothBattery || battery}% (${getEstim(bluetoothBattery || battery)})`
                : `${active_ap}/${total_ap}`
              : 'Connect for %'}
          </Text>
        </View>
      )}
      <View style={styles.section}>
        <User />
        <Text style={styles.text}>{clients}</Text>
      </View>
      <View style={[styles.section, type !== 'ssid' ? { width: '27%' } : null]}>
        {type === 'ssid' ? <Lock /> : <Throughput fill="#a8b1bf" size="16" />}
        <Text numberOfLines={1} style={styles.text}>
          {type === 'ssid'
            ? security
            : `${Math.round(type === 'node' ? downloadRate : gateways_download_rate)}↓/${Math.round(
                type === 'node' ? uploadRate : gateways_upload_rate,
              )}↑`}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  info: {
    width: '100%',
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 6,
  },
  section: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  text: {
    fontSize: 13,
    color: '#6D727A',
    marginLeft: 4,
  },
})
