import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { RestartButton } from './RestartButton'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('RestartButton', () => <RestartButton id="some-id" />)
