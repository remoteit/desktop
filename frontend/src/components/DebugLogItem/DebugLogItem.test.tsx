import React from 'react'
import { mount } from 'enzyme'
import { DebugLogItem } from './DebugLogItem'

describe('components/DebugLogItem', () => {
  test('should not explode', () => {
    mount(<DebugLogItem />)
  })
})
