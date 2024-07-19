import React, { PureComponent } from 'react'
import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import Field from './Field'
import Switch from './Switch'
import {Picker} from '@react-native-picker/picker';
import Button from './Button'
import DefaultHeaderHOC from './DefaultHeaderHOC'
import { AlertHelper } from '../services'
import { ManageThemeContext } from '../theme/ThemeManager'
import { HideEye, ShowEye } from './svg'

export default class CreateSSID extends PureComponent {
  state = {
    secureTextEntry: true,
    secureTextEntryEnterpriseAuth: true,
    secureTextEntryAccountingAuth: true,
    captivePortalsList: ['None', ...this.props.captivePortals.map((el) => el.name)],
    SSID: this.props.route.params?.SSID
      ? {
          ...this.props.route.params?.SSID,
          captive_portal: this.props.route.params?.SSID.captive_portal || 'None',
        }
      : {
          name: '',
          security: 2,
          status: false,
          configuration: false,
          password: '',
          captive_portal: 'None',
        },
    isCaptivePortalsPicker: false,
  }

  toggleSecureTextEntry = () => {
    this.setState((prev) => ({
      secureTextEntry: !prev.secureTextEntry,
    }))
  }

  toggleSecureTextEntryEnterpriseAuth = () => {
    console.log('[CreateSSID.js] - toggleSecureTextEntryEnterpriseAuth')
    this.setState((prev) => ({
      secureTextEntryEnterpriseAuth: !prev.secureTextEntryEnterpriseAuth,
    }))
  }

  toggleSecureTextEntryAccountingAuth = () => {
    console.log('[CreateSSID.js] - toggleSecureTextEntryAccountingAuth')
    this.setState((prev) => ({
      secureTextEntryAccountingAuth: !prev.secureTextEntryAccountingAuth,
    }))
  }

  actionWithSSID = () => {
    const { SSID } = this.state

    if (!SSID.name.trim()) {
      AlertHelper.alert('error', 'Error', 'Name id required')
    } else if (SSID.security !== 3 && SSID.security !== 4 && !SSID.password) {
      AlertHelper.alert('error', 'Error', 'Password field can not be empty')
    } else if (SSID.security !== 3 && SSID.security !== 4 && SSID.password.length < 8) {
      AlertHelper.alert('error', 'Error', 'Password must be 8 to 63 ASCII characters')
    } else {
      const { editSSID, createSSID } = this.props
      const { SSID: prevSSID, networkId } = this.props.route.params
      
      if (prevSSID) {
        editSSID(networkId, SSID)
      } else {
        createSSID(networkId, SSID)
      }
      this.props.navigation.goBack(null)
    }
  }

  dataChange = (dataName, value) => {
    console.log('[CreateSSID.js] - dataChange', dataName, value)
    this.setState((state) => ({ SSID: { ...state.SSID, [dataName]: value } }))
    console.log('[CreateSSID.js] - SSID ', this.state.SSID)
  }

  toggleCaptivePortalsPicker = () => {
    this.setState((state) => ({ isCaptivePortalsPicker: !state.isCaptivePortalsPicker }))
  }

  onValueChangeCaptivePortals = (value) => {
    this.dataChange('captive_portal', value === 0 ? 'None' : this.props.captivePortals[value - 1].id)
  }

  render() {
    const {
      SSID,
      captivePortalsList,
      isSecurityPicker,
      isCaptivePortalsPicker,
      secureTextEntry,
      secureTextEntryEnterpriseAuth,
      secureTextEntryAccountingAuth
    } = this.state

    const { navigation, route, isShowCaptivePortal, captivePortals } = this.props
    const prevSSID = route.params.SSID

    const isChanged =
      ( prevSSID &&
        ( SSID.name !== prevSSID.name ||
          SSID.status !== prevSSID.status ||
          SSID.security !== prevSSID.security ||
          SSID.password !== prevSSID.password || 
          SSID.acct_port !== prevSSID.acct_port || 
          SSID.acct_secret !== prevSSID.acct_secret || 
          SSID.acct_server !== prevSSID.acct_server || 
          SSID.server !== prevSSID.server || 
          SSID.port !== prevSSID.port )) ||

      ( !prevSSID && SSID.name)

    return (
      <ManageThemeContext.Consumer>
        {({ theme }) => (
          <DefaultHeaderHOC
            title={route.params.SSID ? 'Edit SSID' : 'Setup New SSID'}
            navigation={navigation}>
            <KeyboardAvoidingView
              behavior="padding"
              style={{ ...styles.container, backgroundColor: theme.primaryBackground }}>
              <ScrollView>
                <View
                  style={{
                    ...styles.section,
                    backgroundColor: theme.primaryCardBgr,
                    borderColor: theme.primaryBorder,
                  }}>
                  <Field
                    label="SSID Name"
                    placeholder="Enter SSID name"
                    keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                    value={SSID.name}
                    onChangeText={(text) => this.dataChange('name', text)}
                  />

                  <Switch
                    label="Hide SSID"
                    value={SSID.status}
                    onValueChange={(value) => this.dataChange('status', value)}
                  />
                </View>

                <Text style={{...styles.sectionTitle, color: theme.primaryText}}>Security</Text>
                <View
                  style={[
                    { ...styles.section, backgroundColor: theme.primaryCardBgr, borderColor: theme.primaryBorder },
                    styles.sectionWithTitle,
                  ]}>
                  <Picker
                    selectedValue={SSID.security}
                    onValueChange={(itemIndex) => this.dataChange('security', itemIndex)}
                    mode="dropdown"
                  >
                    <Picker.Item label="WPA" value={0} color={theme.primaryText} />
                    <Picker.Item label="WPA2" value={1} color={theme.primaryText} />
                    <Picker.Item label="WPA/WPA2 Mixed Mode" value={2} color={theme.primaryText} />
                    <Picker.Item label="WPA2 Enterprise" value={4} color={theme.primaryText} />
                    <Picker.Item label="None" value={3} color={theme.primaryText} />
                  </Picker>

                  {SSID.security !== 3 && SSID.security !== 4 && (
                    // <Field
                    //   disableBorderBottom
                    //   label="Password"
                    //   keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                    //   placeholder="Enter password"
                    //   value={SSID.password}
                    //   onChangeText={text => this.dataChange('password', text)}
                    // />
                    <Field
                      secureTextEntry={secureTextEntry}
                      toggleSecureTextEntry={this.toggleSecureTextEntry}
                      disableBorderBottom
                      label="Password"
                      keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                      placeholder="Enter password"
                      value={SSID.password}
                      onChangeText={(text) => this.dataChange('password', text)}
                      icon={
                        <View>
                          <TouchableOpacity style={styles.eye} onPress={() => this.toggleSecureTextEntry(2)}>
                            {secureTextEntry ? <HideEye /> : <ShowEye />}
                          </TouchableOpacity>
                        </View>
                      }
                    />
                  )}

                  {SSID.security === 4 && (
                    // <Field
                    //   disableBorderBottom
                    //   label="Password"
                    //   keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                    //   placeholder="Enter password"
                    //   value={SSID.password}
                    //   onChangeText={text => this.dataChange('password', text)}
                    // />
                    <>
                      <Field
                        disableBorderBottom
                        label="Authentication Server"
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                        placeholder="Enter Authentication Server"
                        value={SSID.server}
                        onChangeText={(text) => this.dataChange('server', text)}
                      />
                      <Field
                        disableBorderBottom
                        label="Authentication Port"
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                        placeholder="Enter Authentication Server"
                        value={SSID.port}
                        onChangeText={(text) => this.dataChange('port', text)}
                      />
                      <Field
                        secureTextEntry={secureTextEntryEnterpriseAuth}
                        toggleSecureTextEntry={this.toggleSecureTextEntryEnterpriseAuth}
                        disableBorderBottom
                        label="Authentication Secret"
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                        placeholder="Enter password"
                        value={SSID.password}
                        onChangeText={(text) => this.dataChange('password', text)}
                        icon={
                          <View>
                            <TouchableOpacity style={styles.eye} onPress={() => this.toggleSecureTextEntryEnterpriseAuth(2)}>
                              {secureTextEntryEnterpriseAuth ? <HideEye /> : <ShowEye />}
                            </TouchableOpacity>
                          </View>
                        }
                      />
                      <Field
                        disableBorderBottom
                        label="Accounting Server"
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                        placeholder="Enter Authentication Server"
                        value={SSID.acct_server}
                        onChangeText={(text) => this.dataChange('acct_server', text)}
                      />
                      <Field
                        disableBorderBottom
                        label="Accounting Port"
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                        placeholder="Enter Authentication Server"
                        value={SSID.acct_port}
                        onChangeText={(text) => this.dataChange('acct_port', text)}
                      />
                      <Field
                        secureTextEntry={secureTextEntryAccountingAuth}
                        toggleSecureTextEntry={this.toggleSecureTextEntryAccountingAuth}
                        disableBorderBottom
                        label="Accounting Secret"
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'ascii-capable'}
                        placeholder="Enter password"
                        value={SSID.acct_secret}
                        onChangeText={(text) => this.dataChange('acct_secret', text)}
                        icon={
                          <View>
                            <TouchableOpacity style={styles.eye} onPress={() => this.toggleSecureTextEntryAccountingAuth(2)}>
                              {secureTextEntryAccountingAuth ? <HideEye /> : <ShowEye />}
                            </TouchableOpacity>
                          </View>
                        }
                      />
                    </>
                  )}
                </View>
                {isShowCaptivePortal && (
                  <>
                    <Text style={styles.sectionTitle}>Captive portal</Text>
                    <View style={[styles.section, styles.sectionWithTitle]}>
                      <Picker
                        disableBorderBottom
                        label="Captive portal"
                        items={captivePortalsList}
                        selectedValue={
                          SSID.captive_portal === 'None'
                            ? 0
                            : captivePortals.findIndex((el) => el.id == SSID.captive_portal) + 1
                        }
                        isModalVisible={isCaptivePortalsPicker}
                        toggleModal={this.toggleCaptivePortalsPicker}
                        onValueChange={this.onValueChangeCaptivePortals}
                      />
                    </View>
                  </>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
            <Button
              active={isChanged}
              disabled={!isChanged}
              onPress={this.actionWithSSID}
              text={prevSSID ? 'Save' : 'Create'}
            />
          </DefaultHeaderHOC>
        )}
      </ManageThemeContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E6ECF5',
  },
  sectionWithTitle: {
    marginTop: 12,
  },
  sectionTitle: {
    color: '#666F7A',
    fontSize: 12,
    marginTop: 30,
    marginHorizontal: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
})
