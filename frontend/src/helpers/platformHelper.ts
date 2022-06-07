import { FontSize } from '../styling'

type ITargetPlatform = INumberLookup<string>

export const TARGET_PLATFORMS: ITargetPlatform = {
  0: 'Windows',
  5: 'Windows Desktop',
  10: 'Windows Server',
  256: 'Mac',
  768: 'Unix',
  769: 'Linux',
  1072: 'Raspberry Pi',
  1075: 'remoteit Pi',
  1076: 'remoteit Pi Lite',
  1077: 'remoteit Pi 64',
  1120: 'Debian Linux',
  1121: 'RedHat Linux',
  1185: 'AWS',
  1186: 'Azure',
  1187: 'Google Cloud',
  1200: 'Linux ARM',
  1201: 'NVIDIA Jetson',
  1205: 'OpenWrt',
  1206: 'Advantech',
  1209: 'AXIS',
  1210: 'Synology',
  33792: 'Mobile',
  65535: 'Unknown',
}

export function getTargetPlatform(targetPlatformId = -1) {
  return TARGET_PLATFORMS[targetPlatformId] || TARGET_PLATFORMS[65535]
}

export function getTargetPlatformIcon(id?: number): { name: string; type: IconType; size: FontSize } {
  let type: IconType = 'regular'
  let name: string = 'unknown'
  let size: FontSize = 'xxs'

  switch (id) {
    case 0:
    case 5:
    case 10:
      name = 'windows'
      type = 'brands'
      break
    case 256:
      name = 'apple'
      type = 'brands'
      break
    case 768:
      name = 'union'
      type = 'solid'
      break
    case 769:
    case 1121:
    case 1200:
      name = 'linux'
      type = 'brands'
      break
    case 1072:
    case 1075:
    case 1076:
    case 1077:
      name = 'raspberrypi'
      type = 'brands'
      size = 'xs'
      break
    case 1120:
      name = 'ubuntu'
      type = 'brands'
      break
    case 1185:
      name = 'aws'
      type = 'brands'
      size = 'xs'
      break
    case 1201:
      name = 'nvidia'
      break
    case 1205:
      name = 'openwrt'
      break
    case 1206:
      name = 'advantech'
      break
    case 1209:
      name = 'axis'
      break
    case 1210:
      name = 'nas'
      break
    case 33792:
      name = 'mobile-android'
      break
    case 65535:
      name = 'unknown'
      break
  }

  return { name, type, size }
}
