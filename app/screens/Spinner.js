import React, { PureComponent } from 'react'
import { ProgressCircle } from 'react-native-svg-charts'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import * as Progress from 'react-native-progress'
import { ManageThemeContext } from '../theme/ThemeManager'

const TEXTS = [
  "Loading Network.",
  "Loading Network..",
  "Loading Network..."
]

export default class Spinner extends PureComponent {
  state = {
    progress: 0.01,
    direction: true,
    rotate: 0,
    index: 0,
    hide: true
  }

  componentDidMount() {
    this.animation = requestAnimationFrame(this.step)
    let intervalId = setInterval(() => {
      this.setState({ index: this.state.index + 1 })
    }, 500)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animation)
  }

  step = () => {
    this.animation = requestAnimationFrame(this.step)
    this.setState(state => ({
      progress: state.direction ? state.progress + 0.01 : state.progress - 0.008,
      direction: state.progress >= 0.75 ? false : state.progress <= 0.01 ? true : state.direction,
      rotate: state.rotate >= 360 ? 0 : state.rotate + 8,
    }))
  }

  render() {
    const { isLoading, backdrop = true, loadingCounter, maxNum, navigation } = this.props
    const { progress, rotate } = this.state
    if(isLoading) {
      return (
        <View testID="Spinner" style={[styles.spinnerWrap, backdrop ? styles.backdrop : {}]}>
          <View style={[styles.spinner, { transform: [{ rotate: `${rotate}deg` }] }]}>
            <ProgressCircle
              style={styles.spinner}
              strokeWidth={3}
              progress={progress}
              progressColor="#1F6BFF"
              backgroundColor="#FFF"
            />
          </View>
        </View>
      )
    }
    else {
      return null
    }

  }
}

const styles = StyleSheet.create({
  spinnerWrap: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  spinner: {
    height: 56,
    width: 56,
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  textStyle: {
    fontSize: 18,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold'
  },
  cancelButtonStyle: {
    height: '8%',
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonTextStyle: {
    color: '#000000',
    fontSize: 18,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold'
  }
})
