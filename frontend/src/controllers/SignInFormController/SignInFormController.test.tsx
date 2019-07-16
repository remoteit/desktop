import React from 'react'
import { mount } from 'enzyme'
import { SignInFormController } from './SignInFormController'

describe('components/SignInFormController', () => {
  test('should not explode', () => {
    mount(<SignInFormController />)
  })
})
