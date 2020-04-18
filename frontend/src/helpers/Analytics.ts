import { version } from '../../package.json'
import { emit } from '../services/Controller'

/// <reference types="@types/segment-analytics" />

export default class Analytics {
  private static _instance: Analytics
  private desktopVersion: string
  private context: any

  private constructor() {
    this.desktopVersion = version
    this.context = {
      product: {
        name: 'Desktop',
        version: this.desktopVersion,
      },
      system: {
        //retrieved from backend
        OS: '',
        Version: '',
        Arch: '',
      },
      manufacturer: {
        Code: '',
        Version: '',
      },
    }
  }

  public getOsInfo() {
    emit('osInfo')
  }

  public setArch(arch: any) {
    this.context.system.Arch = arch
  }

  public setOS(os: any) {
    this.context.system.OS = os
  }

  public setOsVersion(version: any) {
    this.context.system.Version = version
  }

  public static get Instance() {
    // Do you need arguments? Make it a regular static method instead.
    return this._instance || (this._instance = new this())
  }

  public identify(userId: string) {
    window.analytics.identify(userId, { trait: {} })
  }

  public clearIdentity() {
    window.analytics.reset()
  }

  public page(pageName: string, additionalContext?: any) {
    let localContext = this.context
    if (additionalContext) {
      localContext = { ...additionalContext, ...localContext }
    }
    window.analytics.page(pageName, localContext)
  }

  public track(trackName: string, additionalContext?: any) {
    let localContext = this.context
    if (additionalContext) {
      localContext = { ...additionalContext, ...localContext }
    }
    window.analytics.track(trackName, localContext)
  }
}
