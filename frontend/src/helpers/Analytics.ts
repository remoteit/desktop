import { version } from '../../package.json'

///  <reference types="@types/google.analytics" />

export default class Analytics {
  private static _instance: Analytics
  private context: any
  private gaAppSet: boolean

  private constructor() {
    this.gaAppSet = false
    this.context = {
      category: 'Desktop',
      productName: 'Desktop',
      productVersion: version,
      //retrieved from backend
      systemOS: '',
      systemOSVersion: '',
      systemArch: '',
      manufacturerName: '',
      manufacturerProductVersion: '',
      manufacturerProductName: '',
      manufacturerProductCode: '',
      manufacturerPlatformName: '',
      manufacturerPlatformCode: '',
    }
  }

  public setManufacturerDetails(details: IManufacturer) {
    this.context.manufacturerName = details.name
    this.context.manufacturerProductVersion = details.product?.version
    this.context.manufacturerProductName = details.product?.name
    this.context.manufacturerProductCode = details.product?.code
    this.context.manufacturerPlatformName = details.platform?.name
    this.context.manufacturerPlatformCode = details.platform?.code
  }

  public setArch(arch: any) {
    this.context.systemArch = arch
  }

  public setOS(os: any) {
    this.context.systemOS = os
  }

  public setOsVersion(version: any) {
    this.context.systemOSVersion = version
  }

  public static get Instance() {
    let instance = this._instance || (this._instance = new this())
    // Do you need arguments? Make it a regular static method instead.
    if (typeof ga !== 'undefined' && !instance.gaAppSet) {
      console.log('SET GA APP VERSION')
      ga('set', 'appName', 'Desktop')
      ga('set', 'appVersion', version)
      instance.gaAppSet = true
    }
    return instance
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
