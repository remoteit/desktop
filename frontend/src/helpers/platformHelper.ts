import { FontSize } from '../styling'

type ITargetPlatform = ILookup<string>

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
  1120: 'Debian Linux',
  1185: 'AWS',
  1200: 'Linux ARM',
  34304: 'remoteit CloudShift',
  65535: 'Unknown',
}

export function getTargetPlatform(targetPlatformId?: number) {
  return TARGET_PLATFORMS[targetPlatformId || -1] || TARGET_PLATFORMS[65535]
}

export function getTargetPlatformIcon(id?: number) {
  let type: IconType = 'brands'
  let name: string = 'hdd'
  let size: FontSize = 'xxs'

  switch (id) {
    case 0:
    case 5:
    case 10:
      name = 'windows'
      break
    case 256:
      name = 'apple'
      break
    case 768:
      name = 'union'
      type = 'solid'
      break
    case 769:
      name = 'linux'
      break
    case 1072:
    case 1075:
    case 1076:
      name = 'raspberry-pi'
      size = 'xs'
      break
    case 1120:
      name = 'ubuntu'
      break
    case 1185:
      name = 'aws'
      size = 'xs'
      break
    case 1200:
      name = 'linux'
      break
    case 34304:
      name = 'cloud-rainbow'
      type = 'solid'
      size = 'xs'
      break
    case 65535:
      name = 'hdd'
      type = 'solid'
      break
  }

  return { name, type, size }
}
