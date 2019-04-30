import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { ServiceListItem } from './ServiceListItem'
import { service } from '../../helpers/mockData'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('ServiceListItem', () => (
    <ServiceListItem connect={action('connect')} service={service()} />
  ))
