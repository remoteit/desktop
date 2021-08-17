import React from 'react'
import { mount } from 'enzyme'
import { ConnectButton } from './ConnectButton'
import { service } from '../../helpers/mockData'

describe('components/ConnectButton', () => {
  test('should not explode', () => {
    mount(<ConnectButton service={service()} />)
  })
})
