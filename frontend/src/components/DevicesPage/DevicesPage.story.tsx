import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DevicesPage } from './DevicesPage'
import { device, service } from '../../helpers/mockData'

const devices = [
  device({ name: 'Doorlock', state: 'active', services: [service()] }),
  device({
    name: 'Windows Admin',
    state: 'connected',
    services: [
      service({ name: 'RDP', type: 'RDP', state: 'connected' }),
      service({ name: 'Samba', type: 'Samba', state: 'active' }),
    ],
  }),
  device({
    name: 'Webcam',
    state: 'inactive',
    services: [
      service({ name: 'Camera', type: 'NX Witness', state: 'inactive' }),
      service({ name: 'Admin', type: 'HTTPS', state: 'inactive' }),
    ],
  }),
]

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('DevicesPage', () => <DevicesPage devices={devices} />)
