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
