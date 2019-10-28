import React from 'react'
import { mount } from 'enzyme'
import { ConnectionsList } from './ConnectionsList'
import { connection } from '../../helpers/mockData'

describe('components/ConnectionsList', () => {
  test('should not explode', () => {
    mount(<ConnectionsList connections={[connection(), connection('Another connection', 33001)]} services={[]} />)
  })
})
