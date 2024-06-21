import { post } from './post'

export default async (eventName: EventName, data) => {
  console.log('EVENT', eventName, data)
  await post({ eventName, data }, '/event')
}
