import React from 'react'
import { mount } from 'enzyme'
import { ServiceList } from './ServiceList'

describe('components/ServiceList', () => {
  test('should not explode', () => {
    mount(<ServiceList />)
  })
})
