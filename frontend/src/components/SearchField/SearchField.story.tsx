import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { SearchField } from './SearchField'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('SearchField', () => <SearchField search={action('search')} />)
