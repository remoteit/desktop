import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ServiceList } from './ServiceList'
import { service } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('ServiceList', () => (
    <Provider store={store}>
      <ServiceList
        services={[
          service({ name: 'Admin', type: 'HTTP', state: 'active' }),
          service({
            name: 'SSH',
            type: 'SSH',
            state: 'connected',
            port: 33000,
          }),
          service({ name: 'Webcam', type: 'NX Witness', state: 'inactive' }),
        ]}
        connections={{}}
      />
    </Provider>
  ))
