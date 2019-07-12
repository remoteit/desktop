import React from 'react'
import { mount } from 'enzyme'
import { QuitLink } from './QuitLink'

describe('components/QuitLink', () => {
  test('should not explode', () => {
    mount(<QuitLink quit={jest.fn()} />)
  })
})
