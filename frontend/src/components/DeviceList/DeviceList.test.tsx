import React from 'react'
import { mount } from 'enzyme'
import { DeviceList } from './DeviceList'
import { boolean } from '@storybook/addon-knobs'

describe('components/DeviceList', () => {
  test('should not explode', () => {
    mount(
      <DeviceList
        searchOnly={boolean('searchOnly', false)}
        searching={boolean('searching', false)}
        query=""
      />
    )
  })
})
