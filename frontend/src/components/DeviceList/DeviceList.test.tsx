import React from 'react'
import { mount } from 'enzyme'
import { DeviceList } from './DeviceList'
import { boolean } from '@storybook/addon-knobs'

describe('components/DeviceList', () => {
  test('should not explode', () => {
    mount(
      <DeviceList
        searchPerformed={true}
        searchOnly={false}
        searching={false}
        query=""
      />
    )
  })
})
