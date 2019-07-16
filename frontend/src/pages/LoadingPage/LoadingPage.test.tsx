import React from 'react'
import { mount } from 'enzyme'
import { LoadingPage } from './LoadingPage'

describe('components/LoadingPage', () => {
  test('should not explode', () => {
    mount(<LoadingPage />)
  })
})
