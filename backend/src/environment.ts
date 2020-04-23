import {
  PATHS,
  MANUFACTURE_ID_HEADLESS,
  MANUFACTURE_ID_STANDARD,
  PLATFORM_CODES,
  PRODUCT_NAME,
  MANUFACTURER_NAME,
} from './constants'
import isElevated from 'is-elevated'
import detectRPi from 'detect-rpi'
import JSONFile from './JSONFile'
import plist from 'plist'
import path from 'path'
import os from 'os'
import fs from 'fs'

export class Environment {
  version: string
  isElevated: boolean = false
  isHeadless: boolean = true
  isWindows: boolean
  isMac: boolean
  isLinux: boolean
  isArmLinux: boolean
  isPi: boolean
  isPiZero: boolean
  simpleOS: Ios
  osVersion: string
  platformCode: number
  manufactureId: number
  privateIP: ipAddress = ''
  adminUsername: string = ''
  userPath: string
  adminPath: string
  binPath: string
  deprecatedBinaries: string[]
  manufacturerDetails: IManufacturer

  EVENTS = { send: 'environment' }

  constructor() {
    const elevated: boolean = true //this.isElevated - always elevated for now

    // @ts-ignore
    this.isPiZero = detectRPi() && process.config.variables.arm_version === '6'
    this.isPi = detectRPi()
    this.isWindows = os.platform() === 'win32'
    this.isMac = os.platform() === 'darwin'
    this.isLinux = os.platform() === 'linux'
    this.isArmLinux = this.isLinux && os.arch() === 'arm64'
    this.simpleOS = this.getSimpleOS()
    this.osVersion = this.getOsVersion()
    this.version = this.getAppVersion()

    if (this.isWindows) {
      this.userPath = PATHS.WIN_USER_SETTINGS
      this.adminPath = PATHS.WIN_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.WIN_ADMIN_BINARIES : PATHS.WIN_USER_BINARIES
      this.deprecatedBinaries = PATHS.WIN_DEPRECATED_BINARIES
    } else if (this.isMac) {
      this.userPath = PATHS.MAC_USER_SETTINGS
      this.adminPath = PATHS.MAC_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.MAC_ADMIN_BINARIES : PATHS.MAC_USER_BINARIES
      this.deprecatedBinaries = PATHS.MAC_DEPRECATED_BINARIES
    } else {
      this.userPath = PATHS.LINUX_USER_SETTINGS
      this.adminPath = PATHS.LINUX_ADMIN_SETTINGS
      this.binPath = elevated ? PATHS.LINUX_ADMIN_BINARIES : PATHS.LINUX_USER_BINARIES
      this.deprecatedBinaries = PATHS.LINUX_DEPRECATED_BINARIES
    }

    this.manufactureId = MANUFACTURE_ID_HEADLESS
    this.manufacturerDetails = this.getManufacturerDetails()
    this.platformCode = this.getPlatformCode()
  }

  get frontend() {
    return {
      os: this.simpleOS,
      osVersion: this.osVersion,
      arch: os.arch(),
      manufacturerDetails: this.manufacturerDetails,
      adminUsername: this.adminUsername,
      isElevated: this.isElevated,
      privateIP: this.privateIP,
      hostname: os.hostname(),
    }
  }

  recapitate() {
    this.isHeadless = false
    this.manufactureId = MANUFACTURE_ID_STANDARD
    this.manufacturerDetails = this.getManufacturerDetails()
  }

  getSimpleOS() {
    if (this.isMac) return 'mac'
    if (this.isWindows) return 'windows'
    if (this.isPi) return 'rpi'
    else return 'linux'
  }

  getPlatformCode() {
    if (this.manufacturerDetails?.platform?.code) return this.manufacturerDetails.platform.code
    if (this.isMac) return PLATFORM_CODES.MAC
    if (this.isWindows) return PLATFORM_CODES.WINDOWS_DESKTOP
    if (this.isPi) return PLATFORM_CODES.RASPBERRY_PI
    if (this.isLinux) return PLATFORM_CODES.LINUX
    if (this.isArmLinux) return PLATFORM_CODES.LINUX_ARM
    return PLATFORM_CODES.UNKNOWN
  }

  getAppVersion() {
    let data = new JSONFile<any>(path.join(__dirname, '../package.json')).read()
    return data.version
  }

  getOsVersion() {
    let release = os.release()
    if (this.isMac) {
      try {
        const versionInfo: any = plist.parse(
          fs.readFileSync('/System/Library/CoreServices/SystemVersion.plist', 'utf8')
        )
        release = versionInfo?.ProductVersion
      } catch {
        release = `Unknown Mac (${release})`
      }
    }
    return release
  }

  getManufacturerDetails(): IManufacturer {
    const fileData = new JSONFile<ManufacturerFile>(path.join(this.adminPath, 'manufacturer.json')).read()
    const manufacturer: IManufacturer = fileData?.manufacturer || {}

    return {
      name: manufacturer.name || MANUFACTURER_NAME,
      product: manufacturer.product || { name: PRODUCT_NAME, code: this.manufactureId, version: this.version },
      platform: manufacturer.platform || { name: `Desktop ${this.simpleOS}`, code: this.platformCode },
    }
  }

  async setElevatedState() {
    this.isElevated = await isElevated()
  }

  toJSON() {
    return {
      isPiZero: this.isPiZero,
      isPi: this.isPi,
      isWindows: this.isWindows,
      isMac: this.isMac,
      isLinux: this.isLinux,
      isArmLinux: this.isArmLinux,
      simpleOS: this.simpleOS,
      userPath: this.userPath,
      adminPath: this.adminPath,
      binPath: this.binPath,
      deprecatedBinaries: this.deprecatedBinaries,
    }
  }
}

export default new Environment()
