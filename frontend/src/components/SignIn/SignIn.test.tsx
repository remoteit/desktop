import React from 'react'
import { mount } from 'enzyme'
import { SignIn } from './SignIn'

describe('components/SignIn', () => {
  test('should not explode', () => {
    mount(<SignIn />)
  })
})
