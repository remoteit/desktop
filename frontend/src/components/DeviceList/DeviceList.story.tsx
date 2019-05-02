import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DeviceList } from './DeviceList'
import { device } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

const devices = [
  device({ name: 'Doorlock', state: 'active' }),
  device({ name: 'Webcam', state: 'inactive' }),
  device({ name: 'AWS Wordpress', state: 'connected' }),
]

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('DeviceList', () => (
    <Provider store={store}>
      <DeviceList devices={devices} />
    </Provider>
  ))
