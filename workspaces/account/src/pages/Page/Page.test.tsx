import React from 'react'
import { mount } from 'enzyme'
import { Page } from './Page'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/Page', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <Page>
          <h1>Hi!</h1>
        </Page>
      </Provider>
    )
  })
})
