import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DebugPage } from './DebugPage'

storiesOf('pages', module)
  .addDecorator(withKnobs)
  .add('DebugPage', () => <DebugPage />)
