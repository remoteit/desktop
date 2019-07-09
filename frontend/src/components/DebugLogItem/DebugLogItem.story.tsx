import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DebugLogItem } from './DebugLogItem'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('DebugLogItem', () => (
    <DebugLogItem
      log={{
        type: 'connectd',
        message: '!!throughput txBps=11 rxBps=26 pl=100000',
        createdAt: new Date(),
        data: {
          type: 'service/throughput',
          raw: '!!throughput txBps=11 rxBps=26 pl=100000',
          id: '80:00:00:00:01:00:45:78',
          port: 33003,
        },
      }}
    />
  ))
