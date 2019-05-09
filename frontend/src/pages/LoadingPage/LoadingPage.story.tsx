import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { LoadingPage } from './LoadingPage'

storiesOf('pages', module)
  .addDecorator(withKnobs)
  .add('LoadingPage', () => <LoadingPage />)
