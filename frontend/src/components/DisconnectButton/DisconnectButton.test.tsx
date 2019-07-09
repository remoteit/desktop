import React from 'react'
import { mount } from 'enzyme'
import { DisconnectButton } from './DisconnectButton'

describe('components/DisconnectButton', () => {
  test('should not explode', () => {
    mount(<DisconnectButton disconnect={jest.fn()} id="some-id" />)
  })
})
