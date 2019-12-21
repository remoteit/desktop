import React from 'react'
import { mount } from 'enzyme'
import { ForgetButton } from './ForgetButton'

describe('components/ForgetButton', () => {
  test('should not explode', () => {
    mount(<ForgetButton />)
  })
})
