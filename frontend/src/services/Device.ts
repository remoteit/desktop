import debug from 'debug'
import { r3, refreshAccessKey } from '../services/remote.it'

const d = debug('r3:desktop:frontend:services:Device')

export async function all() {
  d('Refreshing access key')
  await refreshAccessKey()

  d('Fetching devices')
  return r3.devices.all()
}

export async function count() {
  return r3.devices.count()
}

export async function search(query: string) {
  return r3.devices.search(query)
}
