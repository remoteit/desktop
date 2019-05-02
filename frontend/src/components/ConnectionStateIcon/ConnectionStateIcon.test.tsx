import React from 'react'
import { mount } from 'enzyme'
import { ConnectionStateIcon } from './ConnectionStateIcon'

describe('components/ConnectionStateIcon', () => {
  test('should not explode', () => {
    mount(<ConnectionStateIcon state="inactive" />)
  })
})
