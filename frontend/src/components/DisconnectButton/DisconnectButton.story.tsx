import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DisconnectButton } from './DisconnectButton'
import { connection } from '../../helpers/mockData'
import { action } from '@storybook/addon-actions'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('DisconnectButton', () => <DisconnectButton connection={connection()} />)
