import React from 'react'
import { mount } from 'enzyme'
import { Page } from './Page'

describe('components/Page', () => {
  test('should not explode', () => {
    mount(<Page />)
  })
})
