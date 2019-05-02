import React from 'react'
import { mount } from 'enzyme'
import { DisconnectButtonController } from './DisconnectButtonController'

describe('components/DisconnectButtonController', () => {
  test('should not explode', () => {
    mount(<DisconnectButtonController />)
  })
})
