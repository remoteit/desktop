import React from 'react'
import { mount } from 'enzyme'
import { ConnectedServiceItem } from './ConnectedServiceItem'
import { connection } from '../../helpers/mockData'

describe('components/ConnectedServiceItem', () => {
  test('should not explode', () => {
    mount(<ConnectedServiceItem connection={connection()} />)
  })
})
