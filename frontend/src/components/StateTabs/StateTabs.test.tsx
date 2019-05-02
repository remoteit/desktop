import React from 'react'
import { mount } from 'enzyme'
import { StateTabs } from './StateTabs'

describe('components/StateTabs', () => {
  test('should not explode', () => {
    mount(<StateTabs />)
  })
})
