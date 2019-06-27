import React from 'react'
import { mount } from 'enzyme'
import { StateTabsController } from './StateTabsController'

describe('components/StateTabsController', () => {
  test('should not explode', () => {
    mount(<StateTabsController />)
  })
})
