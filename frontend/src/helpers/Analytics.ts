import { version } from '../../package.json'

///  <reference types="@types/google.analytics" />

export class Analytics {
  private context: any
  private gaAppSet: boolean

  public constructor() {
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

  public identify(userId: string) {
    window.analytics.identify(userId, { trait: {} })
  }

  public clearIdentity() {
    window.analytics.reset()
  }

  private setGAAppVersion() {
    if (typeof window.ga !== 'undefined' && !this.gaAppSet) {
      console.log('SET GA APP VERSION')
      window.ga('set', 'appName', 'Desktop')
      window.ga('set', 'appVersion', version)
      this.gaAppSet = true
    }
  }

  public page = (pageName: string, additionalContext?: any) => {
    try {
      this.setGAAppVersion()
      let localContext = this.context
      if (additionalContext) {
        localContext = { ...additionalContext, ...localContext }
      }
      window.analytics.page(pageName, localContext)
    } catch (e) {
      console.log('Error sending data to Segment: ' + e)
    }
  }

  public track(trackName: string, additionalContext?: any) {
    try {
      this.setGAAppVersion()
      let localContext = this.context
      if (additionalContext) {
        localContext = { ...additionalContext, ...localContext }
      }
      window.analytics.track(trackName, localContext)
    } catch (e) {
      console.log('Error sending data to Segment: ' + e)
    }
  }
}

export default new Analytics()
