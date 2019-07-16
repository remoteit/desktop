import React from 'react'
import { mount } from 'enzyme'
import { DebugPage } from './DebugPage'

describe('components/DebugPage', () => {
  test('should not explode', () => {
    mount(<DebugPage />)
  })
})
