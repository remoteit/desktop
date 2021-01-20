type ITargetPlatform = { [index: number]: string }

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

export function getTargetPlatform(device?: IDevice) {
  return TARGET_PLATFORMS[device?.targetPlatform || -1]
}
