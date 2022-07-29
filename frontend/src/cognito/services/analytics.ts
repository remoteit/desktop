import { ISegmentSettings } from '../components/CognitoAuth'

const SegmentIntegration = require('@segment/analytics.js-integration-segmentio')
const Analytics = require('@segment/analytics.js-core/build/analytics')

export class SegmentAnalytics {
  private analytics = new Analytics()

  public track = (email: string, setting: ISegmentSettings) => {
    const { segmentAppName, segmentKey, appVersion } = setting

    const integrationSettings = {
      'Segment.io': {
        apiKey: segmentKey,
        retryQueue: true,
        addBundledMetadata: true,
      },
    }
    this.analytics.use(SegmentIntegration)
    this.analytics.initialize(integrationSettings)
    this.analytics.track(
      'SignUp',
      {
        category: 'SignUp',
        segmentAppName,
        appVersion,
      },
      { traits: { email } }
    )
  }
}

export default new SegmentAnalytics()
