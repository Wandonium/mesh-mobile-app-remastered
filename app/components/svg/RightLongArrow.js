import React from 'react'
import Svg, { Defs, Path, Use } from 'react-native-svg'

export default () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <Defs>
      <Path id="prefix__a" d="M12.292 4.292a1.003 1.003 0 0 0 0 1.413L17.586 11H4c-.55 0-1 .45-1 1 0 .551.45 1.002 1 1.002h13.586l-5.297 5.296a1 1 0 0 0 1.414 1.414l6.999-6.999c.002 0 .004-.002.007-.005A.997.997 0 0 0 21 12a.998.998 0 0 0-.299-.713l-6.995-6.994A.998.998 0 0 0 12.999 4a.998.998 0 0 0-.707.292z" />
    </Defs>
    <Use fill="#1F6BFF" xlinkHref="#prefix__a" fillRule="evenodd" />
  </Svg>
)