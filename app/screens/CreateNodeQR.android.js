import React, { useState, useRef } from 'react'
import { StyleSheet, View, Text, Image, Vibration, Dimensions } from 'react-native'
import { RNCamera } from 'react-native-camera'
import { Button, DefaultHeaderHOC } from '../components'

const SCREEN_HEIGHT = Dimensions.get('window').height
const SCREEN_WIDTH = Dimensions.get('window').width

const imageCode =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAV4AAAFeCAIAAABCSeBNAAAABmJLR0QA/wD/AP+gvaeTAAAFgklEQVR4nO3dwU5bMRBAUVLx/7+critdEat1Hds5Z43g8YKuZuHBj+fz+QXwp1/vfgBgR9IABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AEEagCANQJAGIEgDEKQBCNIABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AEEagCANQJAGIEgDEL7f/QDh8Xi8+xHe5vl8vvyakfcz6/vMstvz7Gbk/SxmagCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AEEagLDjDsWIDc+cvzRrR2C3333l8+z2u484dDfE1AAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AOHUHYoRu92zMMvKXYwTz//f+rkvZmoAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNABBGoBw8w4F/27WnsXFuwa3MjUAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNABBGoAgDUCwQ3GnWTsL9iM+lqkBCNIABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQDCzTsUt57tn3U3xCy77Vnc+rkvZmoAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNABBGoBw6g7Fyh2B3czaWVj5fWb55M99MVMDEKQBCNIABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gCEh3/azw9m7Sz4MzuOqQEI0gAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAARpAMKOOxS73TUw6xWdeO/DSivf8ywr7/tYzNQABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNADh03coLj4D/9KJuxi77bNczNQABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNADh+90P8JdWnm+/9W6IT94fGbHy3pAN36GpAQjSAARpAII0AEEagCANQJAGIEgDEKQBCNIABGkAwqk7FCvPpR96Bv44J+6hjDj0b8PUAARpAII0AEEagCANQJAGIEgDEKQBCNIABGkAgjQA4dQdihGzzuTfeg/FiJX3LOx2p8Otn+kgUwMQpAEI0gAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAITHof8k/5PttkfgZ13J1AAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AGHHeyg++f//z7qvYaVb76H4cKYGIEgDEKQBCNIABGkAgjQAQRqAIA1AkAYgSAMQpAEIO+5QjDjxnPzK3ZBZP+vW9zxrX2PEie/wy9QAJGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNADh1B2KESt3FnY7J7/yeW69N2TWOzz07gxTAxCkAQjSAARpAII0AEEagCANQJAGIEgDEKQBCNIAhJt3KG618n6Elef/T7ynY8SG+xEjTA1AkAYgSAMQpAEI0gAEaQCCNABBGoAgDUCQBiBIAxDsUNxp5X7EbvcsHLqzsBtTAxCkAQjSAARpAII0AEEagCANQJAGIEgDEKQBCNIAhJt3KJyl/9ms97PbvsYst+6YDDI1AEEagCANQJAGIEgDEKQBCNIABGkAgjQAQRqAIA1AOHWHYuVZ+hMdem7/pZU7Cyt3TDZkagCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AEEagPA49IA38F+ZGoAgDUCQBiBIAxCkAQjSAARpAII0AEEagCANQJAGIEgDEKQBCNIABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNABBGoAgDUCQBiBIAxCkAQjSAARpAII0AEEagCANQJAGIEgDEKQBCNIABGkAgjQAQRqAIA1AkAYgSAMQpAEI0gAEaQCCNADhN2hrBLJ5Cf8kAAAAAElFTkSuQmCC'

const validateQRCode = qr => qr.name && qr.mac && qr.ble

const getDataFromQRCode = qr => {
  const [name, ble, mac, ip] = qr.split('\n')
  return { code: qr, name, ble, mac, ip: `10.86.${ip}` }
}

export default CreateNodeQR = ({ navigation, route }) => {
  const [code, setCode] = useState('')
  const camera = useRef()
  const network = route.params?.network

  const onQRScanned = (qr = '') =>
    navigation.navigate('NodeManual', {
      qr,
      mode: 'create',
      network,
      newNetwork: !!network,
    })

  const handleQRCodeRead = e => {
    if (e.barcodes && e.barcodes.length) {
      const qr = getDataFromQRCode(e.barcodes[0].data)
      if (validateQRCode(qr)) {
        // camera.current.pausePreview()
        Vibration.vibrate()
        setCode(qr)
        onQRScanned(qr)
      }
    }
  }

  return (
    <DefaultHeaderHOC title="Setup New Node" navigation={navigation}>
      <View style={styles.container}>
        <View style={styles.camera}>
          <RNCamera
            ref={camera}
            style={styles.preview}
            type={RNCamera.Constants.Type.back}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to scan QR codes',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}
            onGoogleVisionBarcodesDetected={!code ? handleQRCodeRead : null}>
            {({ status }) => {
              if (status !== 'READY') return null
            }}
          </RNCamera>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.info}>
            <Image style={styles.imageCode} source={{ uri: imageCode }} />
            <Text style={styles.header}>Scan the code</Text>
            <Text style={styles.hint}>
              {'QR Code is at the bottom of your device. Hold your phone and then bring it closer'}
            </Text>
          </View>
          <View style={styles.buttonWrap}>
            <Button active text="Continue without camera" onPress={onQRScanned} />
          </View>
        </View>
      </View>
    </DefaultHeaderHOC>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomSection: {
    backgroundColor: '#FFF',
  },
  buttonWrap: {
    marginVertical: 32,
  },
  info: {
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'center',
  },
  header: {
    fontSize: 22,
    lineHeight: 28,
    color: '#101114',
    fontWeight: '400',
    marginBottom: 16,
  },
  hint: {
    fontSize: 16,
    lineHeight: 20,
    color: '#8F97A3',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  preview: {
    flex: 1,
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCode: {
    width: 80,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 4,
    marginBottom: 8,
  },
})
