import React from 'react'
import { mount } from 'enzyme'
import { DebugLogController } from './DebugLogController'

describe('components/DebugLogController', () => {
  test('should not explode', () => {
    mount(<DebugLogController />)
  })
})
