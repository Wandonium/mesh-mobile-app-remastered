export const ThemeColors = {
  primaryText: {
    light: '#101114',
    dark: '#FFFFFF',
  },
  primaryLightGray: {
    light: '#666F7A',
    dark: '#666F7A',
  },
  primaryDarkGray: {
    light: '#292D33',
    dark: '#FFFFFF',
  },
  primaryButtonGray: {
    light: '#E6EEFF',
    dark: '#303030',
  },
  primaryChartStroke: {
    light: '#cccccc',
    dark: '#606070',
  },
  primaryBackground: {
    light: '#F5F9FF',
    dark: '#161616',
  },
  primaryCardBgr: {
    light: '#FFFFFF',
    dark: '#303030',
  },
  primaryBorder: {
    light: '#E6ECF5',
    dark: '#606060',
  },
  primarySelected: {
    light: '#C0CFED',
    dark: '#666F7A',
  },
  primaryBlue: {
    light: '#157AFB',
    dark: '#FFFFFF',
  },
  primaryLoadingBackground: {
    light: 'rgba(211,211,211,0.8)',
    dark: 'rgba(0,0,0,0.8))',
  },
  primaryLoadingText: {
    light: '#000000',
    dark: '#FFFFFF',
  }
}

export const getTheme = mode => {
  const Theme = {}
  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const key in ThemeColors) {
    Theme[key] = ThemeColors[key][mode]
  }
  
  return Theme
}
