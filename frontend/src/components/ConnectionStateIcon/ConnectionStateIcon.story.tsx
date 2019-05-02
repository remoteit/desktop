import React from 'react'
import { storiesOf } from '@storybook/react'
import { select, withKnobs } from '@storybook/addon-knobs'
import { ConnectionStateIcon } from './ConnectionStateIcon'

const sizes: FontSizes[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']
const states: ConnectionState[] = [
  'active',
  'inactive',
  'connected',
  'connecting',
  'restricted',
]

storiesOf('components/devices', module)
  .addDecorator(withKnobs)
  .add('ConnectionStateIcon', () => (
    <div className="mx-auto my-lg" style={{ maxWidth: '600px' }}>
      <h1>Custom</h1>
      <ConnectionStateIcon
        state={select('state', states, 'active') as ConnectionState}
        size={select('size', sizes as FontSizes[], 'xxxl' as FontSizes)}
      />
      <h1 className="mt-lg">States</h1>
      <table>
        <thead>
          <th />
          {sizes.map(size => (
            <th key={size} className="px-sm py-xs">
              <code>{size}</code>
            </th>
          ))}
        </thead>
        <tbody>
          {states.map(state => (
            <tr>
              <th className="px-sm py-xs">
                <code>{state}</code>
              </th>
              {sizes.map(size => (
                <td key={size} className="px-sm py-xs">
                  <ConnectionStateIcon state={state} size={size} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ))
