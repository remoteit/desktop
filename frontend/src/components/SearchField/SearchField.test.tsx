import React from 'react'
import { mount } from 'enzyme'
import { SearchField } from './SearchField'
import { boolean } from '@storybook/addon-knobs'

describe('components/SearchField', () => {
  test('should not explode', () => {
    mount(
      <SearchField search={jest.fn()} searching={boolean('searching', false)} />
    )
  })
})
