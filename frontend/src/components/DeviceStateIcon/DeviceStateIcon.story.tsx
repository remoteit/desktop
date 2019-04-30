import React from 'react'
import { storiesOf } from '@storybook/react'
import { select, withKnobs } from '@storybook/addon-knobs'
import { DeviceStateIcon } from './DeviceStateIcon'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('DeviceStateIcon', () => (
    <div className="df ai-center jc-center center h-100">
      <DeviceStateIcon
        state={select('state', ['active', 'inactive', 'connected'], 'active')}
        size={select(
          'size',
          ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as FontSizes[],
          'xxxl' as FontSizes
        )}
      />
    </div>
  ))
