import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { Alert } from './Alert'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('Alert', () => <Alert>I'm an alert</Alert>)
