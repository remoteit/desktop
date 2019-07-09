import React from 'react'
import { mount } from 'enzyme'
import { DisconnectButtonController } from './DisconnectButtonController'
import { text } from '@storybook/addon-knobs'

describe('components/DisconnectButtonController', () => {
  test('should not explode', () => {
    mount(<DisconnectButtonController id={text('id', '')} />)
  })
})
