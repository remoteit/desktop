import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { mount } from 'enzyme'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { connection } from '../../helpers/mockData'

describe('components/ConnectionErrorMessage', () => {
  test('should not explode', () => {
    mount(
      <MemoryRouter>
        <ConnectionErrorMessage connection={connection()} />
      </MemoryRouter>
    )
  })
})
