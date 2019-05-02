import React, { useState } from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { StateTabs } from './StateTabs'
import { DeviceState } from 'remote.it'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('StateTabs', () => <Example />)

function Example() {
  const [state, setState] = useState<DeviceState>('active')
  return (
    <StateTabs state={state} handleChange={(s: DeviceState) => setState(s)} />
  )
}
