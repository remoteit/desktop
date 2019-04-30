import React from 'react'
import { mount } from 'enzyme'
import { ServiceController } from './ServiceController'

describe('components/ServiceController', () => {
  test('should not explode', () => {
    mount(<ServiceController />)
  })
})
