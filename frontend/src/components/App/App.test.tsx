import React from 'react'
import { mount } from 'enzyme'
import { App } from './App'

describe('components/App', () => {
  test('should not explode', () => {
    mount(<App />)
  })
})
