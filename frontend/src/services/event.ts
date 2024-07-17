import { post } from './post'
import { getOs, getApp } from './browser'
import { version } from '../helpers/versionHelper'

export default async (eventName: EventName, data) => {
  const event = { eventName, data, os: getOs().toUpperCase(), app: getApp(), version }
  console.log('EVENT', event)
  await post(event, '/event')
}
