import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { ServiceListItem } from './ServiceListItem'
import { service, user } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('ServiceListItem', () => (
    <Provider store={store}>
      <ServiceListItem service={service()} />
    </Provider>
  ))
