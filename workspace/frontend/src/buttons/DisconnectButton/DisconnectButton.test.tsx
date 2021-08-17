import React from 'react'
import { mount } from 'enzyme'
import { DisconnectButton } from './DisconnectButton'

describe('components/DisconnectButton', () => {
  test('should not explode', () => {
    mount(<DisconnectButton />)
  })
})
