import React from 'react'
import { mount } from 'enzyme'
import { SignInForm } from './SignInForm'

describe('components/SignInForm', () => {
  test('should not explode', () => {
    mount(<SignInForm />)
  })
})
