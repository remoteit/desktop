import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ServiceListItem } from './ServiceListItem'
import { connection } from '../../helpers/mockData'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('ServiceListItem', () => <ServiceListItem connection={connection()} />)
