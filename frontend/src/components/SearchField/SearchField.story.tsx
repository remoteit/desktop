import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, boolean } from '@storybook/addon-knobs'
import { action } from '@storybook/addon-actions'
import { SearchField } from './SearchField'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('SearchField', () => (
    <SearchField
      onChange={action('search')}
      onSubmit={action('search')}
      searching={boolean('searching', false)}
      searchOnly={boolean('searchOnly', false)}
    />
  ))
