import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ConnectionsList } from './ConnectionsList'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('ConnectionsList', () => <ConnectionsList connections={[]} services={[]} />)
