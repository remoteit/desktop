import React from 'react'
import { mount } from 'enzyme'
import { ConnectButton } from './ConnectButton'

describe('components/ConnectButton', () => {
  test('should not explode', () => {
    mount(<ConnectButton />)
  })
})
