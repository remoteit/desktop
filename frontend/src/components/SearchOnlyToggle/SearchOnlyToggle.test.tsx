import React from 'react'
import { mount } from 'enzyme'
import { SearchOnlyToggle } from './SearchOnlyToggle'

describe('components/SearchOnlyToggle', () => {
  test('should not explode', () => {
    mount(<SearchOnlyToggle />)
  })
})
