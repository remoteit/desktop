import React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs } from '@storybook/addon-knobs'
import { CopyableText } from './CopyableText'

storiesOf('components', module)
  .addDecorator(withKnobs)
  .add('CopyableText', () => (
    <div className="mx-auto my-lg" style={{ maxWidth: '400px' }}>
      <CopyableText value="copy me!" />
    </div>
  ))
