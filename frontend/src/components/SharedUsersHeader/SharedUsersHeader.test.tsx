import React from 'react'
import { mount } from 'enzyme'
import SharedUsersHeader from './SharedUsersHeader'

describe('components/SharedUsersHeader', () => {
  test('should not explode', () => {
    mount(<SharedUsersHeader />)
  })
})
