import React from 'react'
import { mount } from 'enzyme'
import { QuitLinkController } from './QuitLinkController'

describe('components/QuitLinkController', () => {
  test('should not explode', () => {
    mount(<QuitLinkController />)
  })
})
