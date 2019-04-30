import ua from 'universal-analytics'
import { GOOGLE_ANALYTICS_CODE } from '../constants'
import debug from 'debug'

const d = debug('r3:backend:utils:analytics')

export function event(
  category: string,
  action: string,
  label: string,
  value: number = 1,
  ...rest: any[]
) {
  d('Tracking event: %O', { category, action, label, value, rest })
  return ua(GOOGLE_ANALYTICS_CODE)
    .event(category, action, label, value, ...rest)
    .send()
}
