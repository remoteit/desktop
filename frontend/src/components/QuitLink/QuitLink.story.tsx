import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { QuitLink } from './QuitLink'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('QuitLink', () => <QuitLink quit={action('quit')} />)
