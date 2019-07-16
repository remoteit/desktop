import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { SignOutLink } from './SignOutLink'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('SignOutLink', () => <SignOutLink signOut={action('signOut')} />)
