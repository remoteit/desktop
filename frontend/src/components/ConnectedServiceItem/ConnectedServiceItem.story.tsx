import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ConnectedServiceItem } from './ConnectedServiceItem'
import { connection } from '../../helpers/mockData'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('ConnectedServiceItem', () => (
    <ConnectedServiceItem connection={connection()} />
  ))
