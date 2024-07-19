import React from 'react'
import Svg, { Path } from 'react-native-svg'

export default ({ size = 36, fill = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={fill} d="M18.125 1c-2.834 0-5.165 2.097-5.36 4.747l-3.117-.922a.524.524 0 0 0-.195-.015.523.523 0 0 0-.101.015l-5.5 1.622a.48.48 0 0 0-.352.461v5.045a.472.472 0 0 0 .248.418.522.522 0 0 0 .504 0 .472.472 0 0 0 .248-.418V7.258L9 5.933v12.612L4.5 19.87v-6.012a.472.472 0 0 0-.248-.418.522.522 0 0 0-.504 0 .472.472 0 0 0-.248.418v6.667a.47.47 0 0 0 .204.382.52.52 0 0 0 .444.072L9.5 19.4l5.352 1.578c.096.028.2.028.296 0l5.5-1.623a.48.48 0 0 0 .352-.453V11c.218-.248.436-.501.64-.759 1.01-1.266 1.833-2.64 1.86-4.122v-.015C23.5 3.286 21.086 1 18.125 1zm0 .952c2.418 0 4.37 1.846 4.375 4.145v.007c-.024 1.142-.705 2.363-1.656 3.557-.837 1.05-1.84 2.06-2.719 3.006-.88-.946-1.883-1.948-2.719-2.998-.95-1.194-1.633-2.422-1.656-3.565v-.007c.004-2.3 1.956-4.145 4.375-4.145zm0 1.667c-1.444 0-2.625 1.125-2.625 2.5s1.181 2.5 2.625 2.5 2.625-1.125 2.625-2.5-1.181-2.5-2.625-2.5zm0 .953c.903 0 1.625.687 1.625 1.547 0 .86-.722 1.548-1.625 1.548S16.5 6.98 16.5 6.119c0-.86.722-1.547 1.625-1.547zM10 5.933l2.812.826c.201 1.184.878 2.293 1.688 3.334v9.777L10 18.545V5.933zm5.5 5.35c.779.867 1.588 1.676 2.242 2.404a.51.51 0 0 0 .38.165.51.51 0 0 0 .378-.165c.447-.497.965-1.028 1.5-1.593v6.451l-4.5 1.325v-8.587z" fillRule="evenodd" />
  </Svg>
)