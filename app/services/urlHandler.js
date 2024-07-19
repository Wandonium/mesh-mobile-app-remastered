import { Platform, Linking } from 'react-native'

const subscribe = cb => {
  const formatUrl = url => url.replace(/.*?:\/\//g, '').split('/')

  if (Platform.OS === 'android') {
    Linking.getInitialURL().then(url => {
      if (url) cb(formatUrl(url))
    })
  } else {
    this.linkingListener = Linking.addEventListener('url', ({ url }) => {
      cb(formatUrl(url))
    })
  }
}

const unsubscribe = () => {
  if (Platform.OS === 'ios') {
    this.linkingListener.remove()
  }

}

export default { subscribe, unsubscribe }
