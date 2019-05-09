import React from 'react'
import { storiesOf } from '@storybook/react'
import { text, withKnobs } from '@storybook/addon-knobs'
import { CopyButton } from './CopyButton'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('CopyButton', () => (
    <CopyButton text={text('text', 'Copy this text!')} />
  ))
