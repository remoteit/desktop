import React from 'react'
import { mount } from 'enzyme'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { connection } from '../../helpers/mockData'

describe('components/ConnectionErrorMessage', () => {
  test('should not explode', () => {
    mount(<ConnectionErrorMessage connection={connection()} />)
  })
})
