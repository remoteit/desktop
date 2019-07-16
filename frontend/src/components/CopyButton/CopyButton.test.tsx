import React from 'react'
import { mount } from 'enzyme'
import { CopyButton } from './CopyButton'

describe('components/CopyButton', () => {
  test('should not explode', () => {
    mount(<CopyButton text="Copy me!" />)
  })
})
