import React, { useState } from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { StateTabs } from './StateTabs'

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('StateTabs', () => <Example />)

function Example() {
  const [state, setState] = useState<Tab>('devices')
  return <StateTabs state={state} handleChange={(s: Tab) => setState(s)} />
}
