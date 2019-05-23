import React from 'react'
import { mount } from 'enzyme'
import { ConnectionsList } from './ConnectionsList'

describe('components/ConnectionsList', () => {
  test('should not explode', () => {
    mount(<ConnectionsList />)
  })
})
