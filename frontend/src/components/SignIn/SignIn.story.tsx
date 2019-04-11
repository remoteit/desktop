import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { SignIn } from './SignIn'

storiesOf('pages/SignIn', module)
  .addDecorator(withKnobs)
  .add('Initial state', () => <SignIn />)
