import React from 'react'
import { mount } from 'enzyme'
import { InstallationNotice } from './InstallationNotice'

describe('components/InstallationNotice', () => {
  test('should not explode', () => {
    mount(<InstallationNotice />)
  })
})
