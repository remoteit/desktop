import React from 'react'
import { storiesOf } from '@storybook/react'
import { Logo } from './Logo'

storiesOf('components', module).add('Logo', () => (
  <div className="mx-auto my-xl center" style={{ maxWidth: '600px' }}>
    <h3 className="mt-xxl mb-lg">
      <code>{`<Logo />`}</code>
    </h3>
    <div className="">
      <Logo />
    </div>
    <h3 className="mt-xxl mb-lg">
      <code>{`<Logo white />`}</code>
    </h3>
    <div className="bg-gray-darker my-lg p-xl">
      <Logo white />
    </div>
    <h3 className="mt-xxl mb-lg">
      <code>{`<Logo white mark width={36} />`}</code>
    </h3>
    <div className="bg-gray-darker my-lg p-xl">
      <Logo white mark width={36} />
    </div>
  </div>
))
