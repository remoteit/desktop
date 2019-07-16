import React from 'react'
import { mount } from 'enzyme'
import { SettingsPage } from './SettingsPage'

describe('components/SettingsPage', () => {
  test('should not explode', () => {
    mount(<SettingsPage />)
  })
})
