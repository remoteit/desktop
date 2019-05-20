import React from 'react'
import { mount } from 'enzyme'
import { ConnectedServiceItem } from './ConnectedServiceItem'

describe('components/ConnectedServiceItem', () => {
  test('should not explode', () => {
    mount(<ConnectedServiceItem />)
  })
})
