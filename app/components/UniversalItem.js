import React from 'react'
import { StyleSheet, View, Text, Platform, ActivityIndicator, Switch, TouchableOpacity } from 'react-native'
import CheckBox from '@react-native-community/checkbox'
import UniversalInfo from './UniversalInfo'
import SegmentedControlTab from './SegmentedControlTab'
import { ChevronUp, ChevronDown } from './svg'
import { markerColor } from '../services'
import { useTheme } from '../theme/ThemeManager'

export default ({
  type,
  item: { name, id, status, is_gateway, active_uplink, network_id, order, is_shared = false, battery, ...info },
  isShowSwitch,
  isSwitchDisabled = false,
  isConnecting,
  connected = false,
  details = false,
  toggleDetails = null,
  value,
  onValueChange,
  onRoleChange,
  role = 0,
  onPress,
  onLongPress = null,
  link = null,
  isInvite = null,
}) => {
  const { theme } = useTheme()
  return (
    <TouchableOpacity
      disabled={!onPress}
      onLongPress={() =>
        onLongPress && network_id
          ? onLongPress(type === 'ssid' ? order : id, network_id)
          : onLongPress && !network_id
          ? onLongPress(id, is_shared)
          : null
      }
      onPress={() => onPress && onPress(type === 'ssid' ? order : id, network_id)}
      style={[
        { ...styles.container, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder },
        connected ? styles.connected : {},
        { height: details ? 240 : toggleDetails ? 115 : isInvite ? 65 : 65 },
      ]}>
      {type !== 'ssid' && <View style={[styles.line, { backgroundColor: markerColor(status, is_gateway) }]} />}

      <View style={[styles.containerRow]}>
        <View style={[styles.content, { maxWidth: isShowSwitch || toggleDetails ? '85%' : '100%' }]}>
          <Text numberOfLines={1} style={{ ...styles.name, color: theme.primaryText }}>
            {name}
          </Text>
          {!isInvite && <UniversalInfo bluetoothBattery={battery} type={type} {...info} />}
          {details && (
            <View style={styles.details}>
              <View style={styles.nodeHardInfo}>
                <View style={styles.nodeHardInfoItem}>
                  <Text style={styles.nodeHardInfoTitle}>Connection type</Text>
                  <Text style={{ ...styles.nodeHardInfoValue, color: theme.primaryText }}>
                    {status === 'Active'
                      ? is_gateway
                        ? active_uplink === 'eth'
                          ? 'Ethernet'
                          : cellprovider.trim()
                        : 'Mesh'
                      : 'N/A'}
                  </Text>
                </View>
                <View style={styles.nodeHardInfoItem}>
                  <Text style={styles.nodeHardInfoTitle}>Nearest Gateway</Text>
                  <Text style={{ ...styles.nodeHardInfoValue, color: theme.primaryText }}>{info.nearest}</Text>
                </View>
                <View style={[styles.nodeHardInfoItem, { width: '80%', marginBottom: 0 }]}>
                  <Text style={styles.nodeHardInfoTitle}>MAC Address</Text>
                  <Text style={{ ...styles.nodeHardInfoValue, color: theme.primaryText }}>
                    {info.mac.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        {isShowSwitch && (
          <View>
            {Platform.OS === 'android' && !toggleDetails ? (
              <CheckBox value={value} onValueChange={() => onValueChange(id, network_id)} />
            ) : (
              <Switch
                ios_backgroundColor="#E6ECF5"
                thumbColor="#FFF"
                trackColor={{
                  false: '#E6ECF5',
                  true: '#1F6BFF',
                }}
                onValueChange={() => onValueChange(id, network_id)}
                disabled={isSwitchDisabled}
                value={value}
              />
            )}
            {isInvite && value && (
              <View style={styles.roleTab}>
                <SegmentedControlTab values={['Viewer', 'Manager']} selectedIndex={role} onTabPress={onRoleChange} />
              </View>
            )}
          </View>
        )}
      </View>
      {toggleDetails && (
        <View style={[styles.viewDetails]}>
          {link && (
            <TouchableOpacity style={styles.settings} onPress={link}>
              <Text style={styles.viewDetailsText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.arrow} onPress={toggleDetails}>
            {!details ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </TouchableOpacity>
        </View>
      )}
      {isConnecting && (
        <View style={styles.connecting}>
          <ActivityIndicator size="large" color="#1F6BFF" />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    marginHorizontal: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 0,
    overflow: 'hidden',
  },
  containerRow: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  viewDetails: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    alignContent: 'center',
  },
  line: {
    width: 3,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  connected: {
    borderColor: '#1F6BFF',
  },
  content: {
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
  },
  connecting: {
    justifyContent: 'center',
    position: 'absolute',
    top: 14,
    right: 16,
  },
  settings: {
    height: 28,
    backgroundColor: '#E6EEFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  arrow: {
    height: 28,
    width: 28,
    backgroundColor: '#E6EEFF',
    borderRadius: 4,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  viewDetailsText: {
    color: '#1F6BFF',
    fontSize: 16,
  },
  nodeHardInfo: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nodeHardInfoItem: {
    width: '50%',
    marginBottom: 15,
  },
  nodeHardInfoTitle: {
    fontSize: 12,
    color: '#8F97A3',
  },
  nodeHardInfoValue: {
    marginTop: 5,
    fontSize: 16,
  },
  roleTab: {
    position: 'absolute',
    width: 140,
    top: 0,
    right: 58,
  },
})
