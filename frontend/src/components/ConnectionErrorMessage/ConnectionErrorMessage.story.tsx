import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { connection } from '../../helpers/mockData'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('ConnectionErrorMessage', () => (
    <ConnectionErrorMessage connection={connection()} />
  ))
