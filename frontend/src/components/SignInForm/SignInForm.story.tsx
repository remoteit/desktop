import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import { SignInForm } from './SignInForm'
import { action } from '@storybook/addon-actions'

storiesOf('components/auth', module)
  .addDecorator(withKnobs)
  .add('SignInForm', () => (
    <div className="mx-auto my-lg" style={{ maxWidth: '600px' }}>
      <SignInForm
        signInError={text('signInError', '')}
        signInStarted={boolean('signInStarted', false)}
        signIn={action('onSubmit')}
      />
    </div>
  ))
