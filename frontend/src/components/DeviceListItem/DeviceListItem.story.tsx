import React from 'react'
import { storiesOf } from '@storybook/react'
import { text, withKnobs, select } from '@storybook/addon-knobs'
import { DeviceListItem } from './DeviceListItem'
// import { device } from '../../helpers/mockData'
import { DeviceState } from 'remote.it'
import { List } from '@material-ui/core'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('DeviceListItem', () => (
    <List component="nav">
      {/* <DeviceListItem
        device={device({
          name: text('name', 'Doorlock'),
          state: select(
            'state',
            ['active', 'inactive', 'connected'],
            'active'
          ) as DeviceState,
        })}
      /> */}
    </List>
  ))
