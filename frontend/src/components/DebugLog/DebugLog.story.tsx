import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { DebugLog } from './DebugLog'

const logs = [
  {
    type: 'general' as LogType,
    message: 'Application starting up',
    createdAt: new Date(),
  },
  {
    type: 'connectd' as LogType,
    message:
      '!!request to connect from remot3.it ID or device owned by yusuke@remot3.it  <34726>',
    createdAt: new Date(),
    data: {
      type: 'connectd',
      raw:
        '!!request to connect from remot3.it ID or device owned by yusuke@remot3.it  <34726>',
      serviceID: '80:00:00:F7:EB:00:08:D9',
      port: 33004,
    },
  },
  {
    type: 'connectd' as LogType,
    message: 'Connected to service: "80:00:00:F7:EB:00:08:D9"',
    data: {
      type: 'service/connected',
      raw:
        '!!connected local=0 encryption=1 session=C06179712DAE6B525C47822476E799B8BEF7C0C4 ip=126.208.165.148:40801 at time 2  <34729>',
      serviceID: '80:00:00:F7:EB:00:08:D9',
      port: 33004,
    },
    createdAt: new Date(),
  },
  {
    type: 'connectd' as LogType,
    message: '!!throughput txBps=11 rxBps=26 pl=100000',
    createdAt: new Date(),
    data: {
      type: 'service/throughput',
      raw: '!!throughput txBps=11 rxBps=26 pl=100000',
      serviceID: '80:00:00:00:01:00:45:78',
      port: 33003,
    },
  },
]

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('DebugLog', () => <DebugLog logs={logs} />)
