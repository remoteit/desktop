import React from 'react'
import { mount } from 'enzyme'
import { ForgetButton } from './ForgetButton'
import { MemoryRouter } from 'react-router-dom'

describe('components/ForgetButton', () => {
  test('should not explode', () => {
    mount(
      <MemoryRouter>
        <ForgetButton />
      </MemoryRouter>
    )
  })
})
