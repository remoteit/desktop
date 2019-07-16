import React from 'react'
import { mount } from 'enzyme'
import { SearchField } from './SearchField'

describe('components/SearchField', () => {
  test('should not explode', () => {
    mount(
      <SearchField onChange={jest.fn()} searching={false} searchOnly={false} />
    )
  })
})
