import React from 'react'
import { mount } from 'enzyme'
import { App } from './App'
import { boolean } from '@storybook/addon-knobs'

describe('components/App', () => {
  test('should not explode', () => {
    mount(
      <App
        signInStarted={boolean('signInStarted', false)}
        user={undefined}
        page="devices"
        checkSignIn={jest.fn()}
        setPage={jest.fn()}
      />
    )
  })
})
