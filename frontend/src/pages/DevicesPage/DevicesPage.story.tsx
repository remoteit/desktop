import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean, text } from '@storybook/addon-knobs'
import { DevicesPage } from './DevicesPage'
import { device, service, user } from '../../helpers/mockData'
import { action } from '@storybook/addon-actions'
import { Provider } from 'react-redux'
import { store } from '../../store'

const devices = [
  device({ name: 'Doorlock', state: 'active', services: [service()] }),
  device({
    name: 'Windows Admin',
    state: 'connected',
    services: [
      service({ name: 'RDP', type: 'RDP', state: 'connected', port: 33000 }),
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
  .add('DevicesPage', () => (
    <Provider store={store}>
      <DevicesPage
        allDevices={devices}
        visibleDevices={devices}
        fetch={() => Promise.resolve(action('fetch'))}
        fetching={boolean('fetching', false)}
        searchPerformed={boolean('searchPerformed', false)}
        searchOnly={boolean('searchOnly', false)}
        searching={boolean('searching', false)}
        setQuery={action('setQuery')}
        localSearch={action('localSearch')}
        remoteSearch={action('remoteSearch')}
        // changeSort={action('changeSort')}
        user={user()}
        query={text('query', '')}
        // sort={text('sort', 'alpha') as SortType}
      />
    </Provider>
  ))
