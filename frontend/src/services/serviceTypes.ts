export const serviceTypes = [
  {
    name: 'TCP',
    defaultPort: 445,
    id: 1,
    hex: '01',
  },
  {
    name: 'VNC',
    defaultPort: 5900,
    id: 4,
    hex: '04',
  },
  {
    name: 'RDP',
    defaultPort: 3389,
    id: 5,
    hex: '05',
  },
  {
    name: 'HTTP reverse proxy',
    defaultPort: 80,
    id: 7,
    hex: '07',
  },
  {
    name: 'HTTPS reverse proxy',
    defaultPort: 443,
    id: 8,
    hex: '08',
  },
  {
    name: 'SSH',
    defaultPort: 22,
    id: 28,
    hex: '1C',
  },
  {
    name: 'HTTP',
    defaultPort: 80,
    id: 30,
    hex: '1E',
  },
  {
    name: 'HTTPS',
    defaultPort: 443,
    id: 33,
    hex: '21',
  },
  {
    name: 'Samba',
    defaultPort: 445,
    id: 34,
    hex: '22',
  },
  {
    name: 'Bulk Service',
    defaultPort: 65535,
    id: 35,
    hex: '23',
  },
  {
    name: 'NX Witness',
    defaultPort: 7001,
    id: 37,
    hex: '25',
  },
  {
    defaultPort: 443,
    name: 'NextCloud',
    id: 38,
    hex: '26',
  },
  {
    defaultPort: 1194,
    name: 'Open VPN',
    id: 39,
    hex: '27',
  },
  // {
  //   defaultPort: 25565,
  //   name: 'Minecraft',
  //   id: 41,
  //   hex: '29',
  // },
  {
    defaultPort: 65535,
    name: 'MultiPort',
    id: 40,
    hex: '28',
  },
]

export const emptyServiceType = {
  name: '',
  defaultPort: 0,
  id: 0,
  hex: '',
}

export function findType(type: number) {
  return serviceTypes.find(st => st.id === type) || emptyServiceType
}
