import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { App } from './App'

storiesOf('pages', module)
  .addDecorator(withKnobs)
  .add('App', () => <App />)
