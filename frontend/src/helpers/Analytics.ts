import { version } from '../../package.json'

///  <reference types="@types/google.analytics" />

export default class Analytics {
  private static _instance: Analytics
  private static segment: any
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

  public static setup() {
    var analytics = (window.analytics = window.analytics || [])
    if (!analytics.initialize)
      if (analytics.invoked) window.console && console.error && console.error('Segment snippet included twice.')
      else {
        analytics.invoked = !0
        analytics.methods = [
          'trackSubmit',
          'trackClick',
          'trackLink',
          'trackForm',
          'pageview',
          'identify',
          'reset',
          'group',
          'track',
          'ready',
          'alias',
          'debug',
          'page',
          'once',
          'off',
          'on',
        ]
        analytics.factory = function (t: any) {
          return function () {
            var e = Array.prototype.slice.call(arguments)
            e.unshift(t)
            analytics.push(e)
            return analytics
          }
        }
        for (var t = 0; t < analytics.methods.length; t++) {
          var e = analytics.methods[t]
          analytics[e] = analytics.factory(e)
        }
        analytics.load = function (t: any, e: any) {
          var n = document.createElement('script')
          n.type = 'text/javascript'
          n.async = !0
          n.src = 'https://cdn.segment.com/analytics.js/v1/' + t + '/analytics.min.js'
          var a = document.getElementsByTagName('script')[0]
          a.parentNode?.insertBefore(n, a)
          analytics._loadOptions = e
        }
        analytics.SNIPPET_VERSION = '4.1.0'
        analytics.load('tMedSrVUwDIeRs6kndztUPgjPiVlDmAe')
        // analytics.page()
      }
    Analytics.segment = analytics
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
    Analytics.segment.identify(userId, { trait: {} })
  }

  public clearIdentity() {
    Analytics.segment.reset()
  }

  public page(pageName: string, additionalContext?: any) {
    let localContext = this.context
    if (additionalContext) {
      localContext = { ...additionalContext, ...localContext }
    }
    Analytics.segment.page(pageName, localContext)
  }

  public track(trackName: string, additionalContext?: any) {
    let localContext = this.context
    if (additionalContext) {
      localContext = { ...additionalContext, ...localContext }
    }
    Analytics.segment.track(trackName, localContext)
  }
}
