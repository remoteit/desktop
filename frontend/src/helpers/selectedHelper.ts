import structuredClone from '@ungap/structured-clone'
import { getDevices } from '../selectors/devices'
import { ApplicationState } from '../store'

export function eachSelectedDevice(
  state: ApplicationState,
  selected: IDevice['id'][],
  callback: (device: IDevice) => void
) {
  getDevices(state).forEach(device => {
    if (selected.includes(device.id)) callback(structuredClone(device))
  })
}

export function getSelectedTags(devices?: IDevice[], selected?: IDevice['id'][]) {
  let result: ITag[] = []
  devices?.forEach(d => {
    if (selected?.includes(d.id)) {
      d.tags.forEach(t => {
        if (!result.find(r => r.name === t.name)) result.push(t)
      })
    }
  })
  // sort
  return result
}
