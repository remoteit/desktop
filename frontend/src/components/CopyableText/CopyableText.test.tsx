import React from 'react'
import { mount } from 'enzyme'
import { CopyableText } from './CopyableText'

describe('components/CopyableText', () => {
  test('should not explode', () => {
    mount(<CopyableText />)
  })
})
