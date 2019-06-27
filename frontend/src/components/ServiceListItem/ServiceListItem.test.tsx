import React from 'react'
import { mount } from 'enzyme'
import { ServiceListItem } from './ServiceListItem'
import { service } from '../../helpers/mockData'

describe('components/ServiceListItem', () => {
  test('should not explode', () => {
    mount(<ServiceListItem service={service()} />)
  })
})
