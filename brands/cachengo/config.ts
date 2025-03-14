const config: BrandingConfig = {
  name: 'telepath',
  appName: 'Telepath',
  package: {
    homepage: 'https://telepath.cachengo.com',
    description: 'Telepath cross platform desktop application for creating and hosting connections',
    author: {
      name: 'Cachengo',
      email: 'support@cachengo.com',
    },
    build: {
      appId: 'com.telepath.desktop',
      copyright: 'remot3.it, Inc',
      productName: 'Telepath',
    },
  },
  colors: {
    light: {
      primary: '#F05323',
      primaryDark: '#143156',
      primaryLight: '#F7C4AD',
      primaryLighter: '#FDEAE0',
      primaryHighlight: '#FEF5F0',
      primaryBackground: '#FEF7F4',
    },
    dark: {
      primary: '#F05323',
      primaryDark: '#143156',
      primaryLight: '#B85F3F',
      primaryLighter: '#5A2F1F',
      primaryHighlight: '#3A1F14',
      primaryBackground: '#2F1A11',
    },
  },
}

export default config
