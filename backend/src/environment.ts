import { PATHS, MANUFACTURE_ID_HEADLESS, MANUFACTURE_ID_STANDARD, PRODUCT_NAME, MANUFACTURER_NAME } from './constants'
import isElevated from 'is-elevated'
import detectRPi from 'detect-rpi'
import os from 'os'
import plist from 'plist'
import fs from 'fs'
import path from 'path'

export class Environment {
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
  privateIP: ipAddress = ''
  adminUsername: string = ''
  userPath: string
  adminPath: string
  binPath: string
  deprecatedBinaries: string[]
  manufacturerDetails?: IManufacturer = undefined

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
    this.simpleOS = this.setSimpleOS()

    this.osVersion = os.release()
    if (this.isMac) {
      try {
        let versionInfo: any = plist.parse(fs.readFileSync('/System/Library/CoreServices/SystemVersion.plist', 'utf8'))
        this.osVersion = versionInfo.ProductVersion
      } catch {
        //No System Version File: /System/Library/CoreServices/SystemVersion.plist'
      }
    }

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
  }

  setSimpleOS() {
    if (this.isMac) return 'mac'
    if (this.isWindows) return 'windows'
    if (this.isPi) return 'rpi'
    else return 'linux'
  }

  async setElevatedState() {
    this.isElevated = await isElevated()
  }

  get manufactureId(): number {
    return this.isHeadless ? MANUFACTURE_ID_HEADLESS : MANUFACTURE_ID_STANDARD
  }

  get frontend() {
    if (!this.manufacturerDetails) {
      try {
        let manufactererFile = JSON.parse(fs.readFileSync(path.join(this.adminPath, 'manufacturer.json'), 'utf8'))
        this.manufacturerDetails = manufactererFile.manufacturer
      } catch (e) {
        //catch if file does not exist or does not parse
        //load defaults
        let version = undefined
        try {
          let packageFile = JSON.parse(fs.readFileSync(path.join(process.cwd(), '/package.json'), 'utf8'))
          version = packageFile.version
        } catch (e) {
          //could not read file
        }
        this.manufacturerDetails = {
          name: MANUFACTURER_NAME,
          product: { name: PRODUCT_NAME, code: this.manufactureId, version: version },
          platform: { name: undefined, code: undefined },
        }
      }
    }

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
