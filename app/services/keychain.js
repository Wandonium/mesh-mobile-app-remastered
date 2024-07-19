import * as Keychain from 'react-native-keychain'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert, Platform } from 'react-native'

const getSupportedBiometryType = () => (Platform.OS === 'ios' ? Keychain.getSupportedBiometryType() : null) // return biometryType
const isUseBiometry = async () => (await AsyncStorage.getItem('useBiometry')) === 'true'

const setGenericPassword = async (username, password) => {
  const biometryType = await getSupportedBiometryType()

  if (biometryType && username && password) {
    try {
      await Keychain.setGenericPassword(username, password, {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      })
    } catch (err) {
      console.log(`Could not save credentials, ${err}`)
    }
  }

  if (biometryType && !(await AsyncStorage.getItem('useBiometry'))) {
    await Alert.alert(
      '',
      `If you want to use ${biometryType} for entering into Mesh++, press ok`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: async () => {
            await AsyncStorage.setItem('useBiometry', 'false')
          },
        },
        {
          text: 'OK',
          onPress: async () => {
            await AsyncStorage.setItem('useBiometry', 'true')
          },
        },
      ],
      { cancelable: false }
    )
  }
}

const getGenericPassword = () => {
  try {
    return Keychain.getGenericPassword()
  } catch (err) {
    console.log(`Could not load credentials, ${err}`)
  }
}

const resetGenericPassword = () => {
  try {
    return Keychain.resetGenericPassword()
  } catch (err) {
    console.log(`Could not reset credentials, ${err}`)
  }
}

export default { getSupportedBiometryType, setGenericPassword, getGenericPassword, resetGenericPassword, isUseBiometry }
