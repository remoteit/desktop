import React from 'react'
import { mount } from 'enzyme'
import { NotFoundPage } from './NotFoundPage'

describe('components/NotFoundPage', () => {
  test('should not explode', () => {
    mount(<NotFoundPage />)
  })
})
