import React from 'react'
import { mount } from 'enzyme'
import { SettingsListItem } from './SettingsListItem'

describe('components/SettingsListItem', () => {
  test('should not explode', () => {
    mount(<SettingsListItem />)
  })
})
