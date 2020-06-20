import { version } from '../../package.json'

///  <reference types="@types/google.analytics" />

export const CONNECTION_TYPE_FAILOVER = 'failover'

export class Analytics {
  private context: SegmentContext
  private gaAppSet: boolean

  public constructor() {
    this.context = {
      category: 'Desktop',
      appName: 'Desktop',
      appVersion: version,
      // remaining retrieved from backend if available
    }
    this.gaAppSet = false
  }

  public setup = () => {
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
  }

  public setManufacturerDetails(details: ManufacturerDetails) {
    this.context.manufacturerId = details.manufacturer.id
    this.context.productVersion = details.product.version
    this.context.productId = details.product.id
    this.context.productPlatform = details.product.platform
    this.context.productAppCode = details.product.appCode
  }

  public setOobAvailable(isAvailable: boolean) {
    this.context.oobAvailable = isAvailable
  }

  public setOobActive(isActive: boolean) {
    this.context.oobActive = isActive
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

  public identify(userId: string) {
    window.analytics.identify(userId, { trait: {} })
  }

  public clearIdentity() {
    window.analytics.reset()
  }

  private setGAAppVersion() {
    if (typeof window.ga !== 'undefined' && !this.gaAppSet) {
      window.ga('set', 'appName', 'Desktop')
      window.ga('set', 'appVersion', version)
      this.gaAppSet = true
    }
  }

  public page = (pageName: string, additionalContext?: any) => {
    this.setGAAppVersion()
    let localContext = this.context
    if (additionalContext) {
      localContext = { ...additionalContext, ...localContext }
    }
    localContext.referrer = ''
    localContext.search = ''
    localContext.url = ''
    window.analytics.page(pageName, localContext)
  }

  public track(trackName: string, additionalContext?: any) {
    this.setGAAppVersion()
    let localContext = this.context
    if (additionalContext) {
      localContext = { ...additionalContext, ...localContext }
    }
    window.analytics.track(trackName, localContext)
  }
}

export default new Analytics()
