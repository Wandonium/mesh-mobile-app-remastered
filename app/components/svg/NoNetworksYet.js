import React from 'react'
import Svg, { G, Circle, Path } from 'react-native-svg'
import { useTheme } from '../../theme/ThemeManager'

export default ({ width = 250, height = 250 }) => {
  const { theme } = useTheme()
  return (
    <Svg width={width} height={height}>
      <G transform="translate(1 1)" fill="none" fillRule="evenodd">
        <Circle stroke="#C9E0FB" fill={theme.primaryBackground} cx={124} cy={124} r={71} />
        <Path
          d="M98.88 88.154c-1.293.34-1.284.303-1.284 5.467v4.372l-4.206.03c-3.923.03-4.228.045-4.515.232-1.198.778-1.156 3.93.064 4.749.203.136.862.16 4.448.16h4.21v8.939l.358.364c.852.864 3.465.977 4.574.198.669-.47.676-.522.676-5.232v-4.27h4.134c3.567 0 4.175-.022 4.428-.166 1.172-.663 1.384-3.472.337-4.475-.538-.516-.577-.52-5.01-.52h-3.89V93.75c0-4.557-.019-4.73-.567-5.22-.553-.494-2.549-.693-3.757-.375m28.627 11.48c-1.208.26-1.54.382-2.22.82-1.705 1.094-1.628.493-1.628 12.824v10.316l-9.925.028-9.925.029-.605.272c-3.73 1.676-3.752 10.156-.03 11.818l.525.234 9.977.029 9.977.029.03 10.662.03 10.663.24.428c.558.998 1.615 1.63 3.444 2.063.962.226 5.125.19 6.049-.052 1.505-.396 2.483-1.038 3.104-2.038l.25-.401.03-10.663.03-10.662 9.977-.03 9.977-.028.55-.26c1.875-.886 2.631-2.597 2.636-5.955.004-3.321-.717-4.896-2.66-5.81l-.636-.3-9.923-.028-9.922-.028-.03-10.61-.03-10.61-.271-.527c-.562-1.086-1.567-1.753-3.247-2.156-1.043-.25-4.707-.286-5.774-.057"
          fill="#ADC9FF"
        />
        <Circle stroke="#B9D6FC" cx={124} cy={124} r={95} />
        <Circle stroke="#D4E5FB" cx={124} cy={124} r={124} />
      </G>
    </Svg>
  )
}