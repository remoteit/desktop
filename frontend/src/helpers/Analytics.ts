/// <reference types="@types/segment-analytics" />
import { version } from '../../package.json'

export interface Config {
  //   analytics: SegmentAnalytics.AnalyticsJS
}

export default class Analytics {
  //private analytics: SegmentAnalytics.AnalyticsJS
  private static _instance: Analytics
  private desktopVersion: string
  private context: any

  private constructor(config: Partial<Config> = {}) {
    // this.config = this.combineConfig(config)
    //this.analytics = config.analytics
    this.desktopVersion = version
    this.context = {
      context: {
        app: {
          name: 'Desktop',
          version: this.desktopVersion,
        },
      },
    }
  }

  public static get Instance() {
    // Do you need arguments? Make it a regular static method instead.
    return this._instance || (this._instance = new this())
  }

  public identify(userId: string, email: string) {
    window.analytics.identify(userId, { trait: { email: email } })
  }

  public clearIdentity() {
    window.analytics.reset()
  }

  public page(pageName: string) {
    window.analytics.page(pageName, this.context)
  }

  public track(trackName: string) {
    window.analytics.track(trackName, this.context)
  }
}
