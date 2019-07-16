import React from 'react'
import { mount } from 'enzyme'
import { SignInPage } from './SignInPage'

describe('components/SignInPage', () => {
  test('should not explode', () => {
    mount(<SignInPage />)
  })
})
