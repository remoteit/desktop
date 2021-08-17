import React from 'react'
import { mount } from 'enzyme'
import { Body } from './Body'

describe('components/Body', () => {
  test('should not explode', () => {
    mount(<Body/>)
  })
})
