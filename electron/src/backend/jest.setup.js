// Mock the branding configuration for tests
jest.mock(
  '@common/brand/config',
  () => ({
    default: {
      name: 'remoteit',
      appName: 'Remote.It',
      package: {
        homepage: 'https://app.remote.it',
        description: 'Remote.It cross platform desktop application',
        author: {
          name: 'Remote.It',
          email: 'support@remote.it',
        },
        build: {
          appId: 'it.remote.desktop',
          copyright: 'remot3.it, Inc',
          productName: 'Remote.It',
        },
      },
      colors: {
        light: {
          primary: '#0096e7',
          primaryDark: '#034b9d',
          primaryLight: '#9ed3f0',
          primaryLighter: '#daf0ff',
          primaryHighlight: '#edf8ff',
          primaryBackground: '#EAF4FA',
        },
        dark: {
          primary: '#0096e7',
          primaryDark: '#034b9d',
          primaryLight: '#1C72AD',
          primaryLighter: '#21435B',
          primaryHighlight: '#1f3042',
          primaryBackground: '#212a35',
        },
      },
    },
  }),
  { virtual: true }
)

// Mock AirBrake to prevent open handles during tests
jest.mock(
  './AirBrake',
  () => ({
    __esModule: true,
    default: {
      notify: jest.fn(),
      close: jest.fn(),
      addFilter: jest.fn(),
      setHost: jest.fn(),
      addReporter: jest.fn(),
    },
  }),
  { virtual: true }
)
