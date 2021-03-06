import { ApplicationState } from '../store'
import { isRemoteUI } from './uiHelper'

export function getLinks(state: ApplicationState, deviceID?: string) {
  const remoteUILinks: ILookup<string> = {
    home: '/configure',
    setup: '/configure',
    waiting: '/configure/waiting',
    edit: '/configure/:deviceID',
    add: '/configure/:deviceID/add',
    scan: '/configure/:deviceID/add/scan',
    service: '/configure/:deviceID/:serviceID',
  }
  const fullUILinks: ILookup<string> = {
    home: '/devices',
    setup: '/devices/setup',
    waiting: '/devices/setupWaiting',
    edit: '/devices/:deviceID/edit',
    add: '/devices/:deviceID/edit/add-service',
    scan: '/devices/:deviceID/edit/add-service/network',
    service: '/devices/:deviceID/edit/:serviceID',
  }

  let links = isRemoteUI(state) ? remoteUILinks : fullUILinks

  if (deviceID) {
    for (const key in links) {
      links[key] = links[key].replace(':deviceID', deviceID)
    }
  }

  return links
}
