import React from 'react'
import { mount } from 'enzyme'
import { ServiceListItem } from './ServiceListItem'

describe('components/ServiceListItem', () => {
  test('should not explode', () => {
    mount(<ServiceListItem />)
  })
})
