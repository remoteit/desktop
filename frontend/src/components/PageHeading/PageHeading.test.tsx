import React from 'react'
import { mount } from 'enzyme'
import { PageHeading } from './PageHeading'

describe('components/PageHeading', () => {
  test('should not explode', () => {
    mount(<PageHeading />)
  })
})
