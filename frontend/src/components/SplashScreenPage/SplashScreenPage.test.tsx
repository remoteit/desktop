import React from 'react'
import { mount } from 'enzyme'
import { SplashScreenPage } from './SplashScreenPage'

describe('components/SplashScreenPage', () => {
  test('should not explode', () => {
    mount(<SplashScreenPage />)
  })
})
