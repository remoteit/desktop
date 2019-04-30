import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { NoDevicesMessage } from './NoDevicesMessage'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('NoDevicesMessage', () => <NoDevicesMessage />)
