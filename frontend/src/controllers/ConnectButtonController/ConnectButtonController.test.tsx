import React from 'react'
import { mount } from 'enzyme'
import { ConnectButtonController } from './ConnectButtonController'

describe('components/ConnectButtonController', () => {
  test('should not explode', () => {
    mount(<ConnectButtonController />)
  })
})
