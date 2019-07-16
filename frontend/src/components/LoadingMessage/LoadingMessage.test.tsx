import React from 'react'
import { mount } from 'enzyme'
import { LoadingMessage } from './LoadingMessage'

describe('components/LoadingMessage', () => {
  test('should not explode', () => {
    mount(<LoadingMessage />)
  })
})
