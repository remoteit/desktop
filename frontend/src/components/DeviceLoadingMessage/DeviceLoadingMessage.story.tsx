import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DeviceLoadingMessage } from './DeviceLoadingMessage'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('DeviceLoadingMessage', () => <DeviceLoadingMessage />)
