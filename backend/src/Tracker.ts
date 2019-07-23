import ua from 'universal-analytics'
import { GOOGLE_ANALYTICS_CODE } from './constants'
import debug from 'debug'

const d = debug('r3:backend:Tracker')

class Tracker {
  private ua: ua.Visitor

  constructor() {
    this.ua = ua(GOOGLE_ANALYTICS_CODE)
  }

  set uuid(uuid: string) {
    this.ua.set('uid', uuid)
  }

  event(
    category: string,
    action: string,
    label: string,
    value: number = 1,
    ...rest: any[]
  ) {
    d('Tracking event: %O', { category, action, label, value, rest })
    return this.ua.event(category, action, label, value, ...rest).send()
  }

  screenView(screenName: string, appName: string, ...rest: any[]) {
    // TODO: report version
    return this.ua.screenview(screenName, appName, ...rest).send()
  }

  pageView(page: string, ...args: any[]) {
    return this.ua.pageview(page, ...args).send()
  }
}

export default new Tracker()
