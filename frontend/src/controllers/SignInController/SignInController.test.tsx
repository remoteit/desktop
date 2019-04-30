import React from 'react'
import { mount } from 'enzyme'
import { SignInController } from './SignInController'

describe('components/SignInController', () => {
  test('should not explode', () => {
    mount(<SignInController />)
  })
})
