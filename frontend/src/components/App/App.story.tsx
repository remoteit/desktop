import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { App } from './App'

storiesOf('pages/App', module)
  .addDecorator(withKnobs)
  .add('Initial state', () => <App />)
