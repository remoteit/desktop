import React from 'react'
import { mount } from 'enzyme'
import { ConnectionsPage } from './ConnectionsPage'

describe('components/ConnectionsPage', () => {
  test('should not explode', () => {
    mount(<ConnectionsPage />)
  })
})
