import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import { RestartButton } from './RestartButton'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('RestartButton', () => (
    <RestartButton connected={boolean('connected', false)} id="some-id" />
  ))
