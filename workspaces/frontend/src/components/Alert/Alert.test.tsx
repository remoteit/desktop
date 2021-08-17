import React from 'react'
import { mount } from 'enzyme'
import { Alert } from './Alert'

describe('components/Alert', () => {
  test('should not explode', () => {
    mount(<Alert>I'm an alert</Alert>)
  })
})
