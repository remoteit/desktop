const config: BrandingConfig = {
  name: 'telepath',
  appName: 'Telepath',
  androidPackageName: 'com.telepath',
  package: {
    homepage: 'https://telepath.cachengo.com',
    description: 'Telepath cross platform desktop application for creating and hosting connections',
    author: {
      name: 'Cachengo',
      email: 'support@cachengo.com',
    },
    build: {
      appId: 'com.telepath.desktop',
      copyright: 'Cachengo, Inc',
      productName: 'Telepath',
    },
    repository: {
      type: 'git',
      url: 'git+ssh://git@github.com/cachengo/desktop.git',
    },
  },
  colors: {
    light: {
      primary: '#F05323',
      primaryDark: '#143156',
      primaryLight: '#F7C4AD',
      primaryLighter: '#f9e6dc',
      primaryHighlight: '#FEF5F0',
      primaryBackground: '#fdf5f2',
      brandPrimary: '#F05323',
      brandSecondary: '#143156',
    },
    dark: {
      primary: '#F05323',
      primaryDark: '#143156',
      primaryLight: '#B85F3F',
      primaryLighter: '#5A2F1F',
      primaryHighlight: '#392823',
      primaryBackground: '#302522',
      brandPrimary: '#F05323',
      brandSecondary: '#143156',
    },
  },
}

export default config
