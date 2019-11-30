import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import { RestartButton } from './RestartButton'
import { connection } from '../../helpers/mockData'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('RestartButton', () => <RestartButton connection={connection()} />)
