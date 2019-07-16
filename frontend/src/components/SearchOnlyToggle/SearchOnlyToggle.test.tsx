import React from 'react'
import { mount } from 'enzyme'
import { SearchOnlyToggle } from './SearchOnlyToggle'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/SearchOnlyToggle', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <SearchOnlyToggle />
      </Provider>
    )
  })
})
