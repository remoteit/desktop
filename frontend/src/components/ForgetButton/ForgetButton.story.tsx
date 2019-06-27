import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { ForgetButton } from './ForgetButton'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('ForgetButton', () => <ForgetButton serviceID="foo" />)
