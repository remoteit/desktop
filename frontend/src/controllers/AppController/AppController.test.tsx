import React from 'react'
import { mount } from 'enzyme'
import { AppController } from './AppController'

describe('components/AppController', () => {
  test('should not explode', () => {
    mount(<AppController />)
  })
})
