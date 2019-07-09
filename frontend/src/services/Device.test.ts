import Device from './Device'
import { device } from '../helpers/mockData'

describe('models/devices', () => {
  const devices = [
    device({ name: 'monkey', state: 'inactive' }),
    device({ name: 'Aardvark', state: 'inactive' }),
    device({ name: 'Panda', state: 'connected' }),
    device({ name: 'zebra', state: 'active' }),
    device({ name: 'Badger', state: 'active' }),
  ]

  test('should default to sorting by alpha only', async () => {
    const expected = [
      devices[1],
      devices[4],
      devices[0],
      devices[2],
      devices[3],
    ]
    const actual = Device.sort(devices)
    expect(actual).toEqual(expected)
  })

  test('should sort by device state', async () => {
    const expected = [
      devices[2],
      devices[4],
      devices[3],
      devices[1],
      devices[0],
    ]
    const actual = Device.sort(devices, 'state')
    expect(actual).toEqual(expected)
  })
})
