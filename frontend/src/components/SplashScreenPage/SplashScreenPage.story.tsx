import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { SplashScreenPage } from './SplashScreenPage'
import { StateProvider } from '../../store'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('SplashScreenPage', () => (
    <StateProvider>
      <SplashScreenPage />
    </StateProvider>
  ))
