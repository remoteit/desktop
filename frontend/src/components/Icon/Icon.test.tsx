import React from 'react'
import { mount } from 'enzyme'
import { Icon } from './Icon'

describe('components/Icon', () => {
  test('should not explode', () => {
    mount(<Icon name="rocket" />)
  })
})
