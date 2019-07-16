import React from 'react'
import { mount } from 'enzyme'
import { ServiceList } from './ServiceList'
import { service } from '../../helpers/mockData'

describe('components/ServiceList', () => {
  test('should not explode', () => {
    mount(<ServiceList services={[service(), service({ name: 'Foo' })]} />)
  })
})
