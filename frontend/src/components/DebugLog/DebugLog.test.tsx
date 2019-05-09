import React from 'react'
import { mount } from 'enzyme'
import { DebugLog } from './DebugLog'

describe('components/DebugLog', () => {
  test('should not explode', () => {
    mount(<DebugLog />)
  })
})
