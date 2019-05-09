import React from 'react'
import { mount } from 'enzyme'
import { SignOutLink } from './SignOutLink'

describe('components/SignOutLink', () => {
  test('should not explode', () => {
    mount(<SignOutLink />)
  })
})
