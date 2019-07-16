import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, select, text } from '@storybook/addon-knobs'
import { Icon } from './Icon'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('Icon', () => (
    <div className="my-xxl center">
      <Icon
        name={text('name', 'rocket')}
        weight={select<IconWeight>(
          'weight',
          ['light', 'regular', 'solid'],
          'light'
        )}
      />
    </div>
  ))
