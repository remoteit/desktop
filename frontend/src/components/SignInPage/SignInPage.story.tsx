import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { SignInPage } from './SignInPage'
import { action } from '@storybook/addon-actions'

storiesOf('components/auth', module)
  .addDecorator(withKnobs)
  .add('SignInPage', () => (
    <SignInPage login={action('login')} user={undefined} />
  ))
