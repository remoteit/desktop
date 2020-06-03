import { DEFAULT_TARGET } from '../shared/constants'

export const serviceTypes = [
  {
    name: 'TCP',
    defaultPort: 0,
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
  // {
  // defaultPort: 29999,
  // name: 'remoteit admin',
  // id: 42,
  // hex: '2A',
  // },
]

export const emptyServiceType = {
  name: '',
  defaultPort: 0,
  id: 0,
  hex: '',
}

export function findType(typeId: number) {
  return serviceTypes.find(st => st.id === typeId) || emptyServiceType
}

export function getTypeId(port: number) {
  const type = serviceTypes.find(st => st.defaultPort === port)
  // FIXME: temp hack to get remoteit admin to be http reverse proxy
  if (port === 29999) return 7
  return type ? type.id : DEFAULT_TARGET.type
}

export function parseType(rawType: string) {
  const pairs = rawType.split(':')
  const typeHex = '0x' + pairs[0] + pairs[1]
  const portHex = '0x' + pairs[10] + pairs[11]
  const typeID = parseInt(typeHex, 16)
  return {
    typeID,
    port: parseInt(portHex, 16),
    type: findType(typeID).name,
  }
}
