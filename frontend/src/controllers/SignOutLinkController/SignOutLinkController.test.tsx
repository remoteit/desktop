import React from 'react'
import { mount } from 'enzyme'
import { SignOutLinkController } from './SignOutLinkController'

describe('components/SignOutLinkController', () => {
  test('should not explode', () => {
    mount(<SignOutLinkController />)
  })
})
