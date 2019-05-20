import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ConnectedServiceItem } from './ConnectedServiceItem'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('ConnectedServiceItem', () => (
    <ConnectedServiceItem
      name="Foobar"
      port={33000}
      serviceID="80:00:00:00:00"
      type="SSH"
    />
  ))
