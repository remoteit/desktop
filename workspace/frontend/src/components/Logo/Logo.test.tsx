import React from 'react'
import { mount } from 'enzyme'
import { Logo } from './Logo'

describe('components/Logo', () => {
  test('should not explode', () => {
    mount(<Logo />)
  })
})
