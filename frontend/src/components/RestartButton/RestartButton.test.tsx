import React from 'react'
import { mount } from 'enzyme'
import { RestartButton } from './RestartButton'

describe('components/RestartButton', () => {
  test('should not explode', () => {
    mount(<RestartButton connected={false} id="foo" />)
  })
})
