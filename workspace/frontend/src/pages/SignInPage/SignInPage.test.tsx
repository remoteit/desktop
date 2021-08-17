import React from 'react'
import { mount } from 'enzyme'
import { SignInPage } from './SignInPage'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/SignInPage', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <SignInPage />
      </Provider>
    )
  })
})
