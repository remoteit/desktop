import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { NotFoundPage } from './NotFoundPage'

storiesOf('pages', module)
  .addDecorator(withKnobs)
  .add('NotFoundPage', () => <NotFoundPage />)
