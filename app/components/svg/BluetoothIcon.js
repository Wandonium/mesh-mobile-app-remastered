import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ focused, size = "26" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={focused ? '#1F6BFF' : '#a3acba'} d="M14.2 12l2.3 2.3c.3-.7.4-1.5.4-2.3 0-.8-.2-1.6-.4-2.3L14.2 12zm5.3-5.3L18.3 8c.6 1.2 1 2.6 1 4s-.4 2.8-1 4l1.2 1.2c1-1.5 1.5-3.4 1.5-5.3s-.5-3.7-1.5-5.2zm-3.8 1L10 2H9v7.6L4.4 5 3 6.4 8.6 12 3 17.6 4.4 19 9 14.4V22h1l5.7-5.7-4.3-4.3 4.3-4.3zM11 5.8l1.9 1.9L11 9.6V5.8zm1.9 10.5L11 18.2v-3.8l1.9 1.9z" fillRule="evenodd" />
  </Svg>
)