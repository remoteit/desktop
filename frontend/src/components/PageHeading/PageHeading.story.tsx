import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { PageHeading } from './PageHeading'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('PageHeading', () => <PageHeading>Hello World</PageHeading>)
