import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Animated, Dimensions, StyleSheet, Text, Pressable } from 'react-native'
import { ViewPropTypes } from 'deprecated-react-native-prop-types'
import { TouchableOpacity } from '@gorhom/bottom-sheet'

const getSegmentedBackgroundColor = (theme, colorValueFromProps) => {
  return colorValueFromProps || (theme === 'LIGHT' ? '#E5E5EA' : '#4a5568')
}

const getSegmentedTextColor = (theme, colorValueFromProps) => {
  return colorValueFromProps || (theme === 'LIGHT' ? 'black' : 'white')
}

const getActiveSegmentedBackgroundColor = (theme, colorValueFromProps) => {
  return colorValueFromProps || (theme === 'LIGHT' ? 'white' : 'black')
}

const getActiveSegmentedTextColor = (theme, colorValueFromProps) => {
  return colorValueFromProps || (theme === 'LIGHT' ? 'black' : 'white')
}

const defaultShadowStyle = {
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.23,
  shadowRadius: 2.62,

  elevation: 4,
}

const SegmentedControl = (props) => {
  const { width, shadowStyle } = props
  const translateValue = (width - 4) / props?.tabs?.length
  const [tabTranslate, setTabTranslate] = React.useState(new Animated.Value(0))
  const shadow = shadowStyle || defaultShadowStyle
  // useCallBack with an empty array as input, which will call inner lambda only once and memoize the reference for future calls
  const memoizedTabPressCallback = React.useCallback(
    (index) => {
      props?.onChange(index)
    },
    [props?.onChange],
  )

  useEffect(() => {
    // If phone is set to RTL, make sure the animation does the correct transition.
    const transitionMultiplier = props?.isRTL ? -1 : 1

    // Animating the active index based current index
    Animated.spring(tabTranslate, {
      toValue: props?.currentIndex * (transitionMultiplier * translateValue),
      stiffness: 150,
      damping: 20,
      mass: 1,
      useNativeDriver: true,
    }).start()
  }, [props?.currentIndex])

  return (
    <Animated.View
      style={[
        props?.containerStyle,
        styles.segmentedControlWrapper,
        {
          width,
        },
        {
          backgroundColor: getSegmentedBackgroundColor(props?.theme, props?.segmentedControlBackgroundColor),
        },
        {
          paddingVertical: props?.paddingVertical,
        },
      ]}>
      <Animated.View
        style={[
          {
            ...StyleSheet.absoluteFill,
            position: 'absolute',
            width: (width - 4) / props?.tabs?.length,
            top: 0,
            marginVertical: 2,
            marginHorizontal: 2,
            backgroundColor: getActiveSegmentedBackgroundColor(props?.theme, props?.activeSegmentBackgroundColor),
            borderRadius: 6,
            ...shadow,
          },
          {
            transform: [
              {
                translateX: tabTranslate,
              },
            ],
          },
        ]}
      />
      {props?.tabs.map((tab, index) => {
        const isCurrentIndex = props?.currentIndex === index
        return (
          <Pressable key={index} style={[styles.textWrapper]} activeOpacity={0.7}>
            <TouchableOpacity onPress={() => memoizedTabPressCallback(index)}>
              <Text
                numberOfLines={1}
                style={[
                  styles.textStyles,
                  props?.textStyle,
                  isCurrentIndex
                    ? {
                        color: getActiveSegmentedTextColor(props?.theme, props?.activeTextColor),
                        fontWeight: props?.activeTextWeight,
                      }
                    : {
                        color: getSegmentedTextColor(props?.theme, props?.textColor),
                      },
                  // { zIndex: 10 },
                ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          </Pressable>
        )
      })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  segmentedControlWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'space-around',
  },
  textWrapper: {
    flex: 1,
    elevation: 19,
    zIndex: 9,
    paddingHorizontal: 5,
  },
  textStyles: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '400',
  },
})

SegmentedControl.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  currentIndex: PropTypes.number.isRequired,
  segmentedControlBackgroundColor: PropTypes.string,
  activeSegmentBackgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  activeTextColor: PropTypes.string,
  activeTextWeight: PropTypes.string,
  paddingVertical: PropTypes.number,
  width: PropTypes.number,
  containerStyle: ViewPropTypes.style,
  textStyle: PropTypes.object,
  isRTL: PropTypes.bool,
  theme: PropTypes.oneOf(['LIGHT', 'DARK']),
  shadowStyle: PropTypes.shape({
    shadowColor: PropTypes.string,
    shadowOffset: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
    shadowOpacity: PropTypes.number,
    shadowRadius: PropTypes.number,
    elevation: PropTypes.number,
  }),
}

SegmentedControl.defaultProps = {
  tabs: [],
  onChange: () => {},
  currentIndex: 0,
  segmentedControlBackgroundColor: null,
  activeSegmentBackgroundColor: null,
  textColor: null,
  activeTextColor: null,
  activeTextWeight: '600',
  paddingVertical: 12,
  width: Dimensions.get('screen').width - 32,
  containerStyle: {},
  textStyle: {},
  isRTL: false,
  theme: 'LIGHT',
  shadowStyle: null,
}

export default SegmentedControl
