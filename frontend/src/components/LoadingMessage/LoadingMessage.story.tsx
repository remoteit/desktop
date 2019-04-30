import React from 'react'
import { storiesOf } from '@storybook/react'
import { text, withKnobs } from '@storybook/addon-knobs'
import { LoadingMessage } from './LoadingMessage'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('LoadingMessage', () => (
    <LoadingMessage message={text('message', 'Loading awesome...')} />
  ))
