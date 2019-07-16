import React from 'react'
import { mount } from 'enzyme'
import { SignInFormController } from './SignInFormController'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/SignInFormController', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <SignInFormController />
      </Provider>
    )
  })
})
