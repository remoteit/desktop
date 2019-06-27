import React from 'react'
import { mount } from 'enzyme'
import { ConnectButtonController } from './ConnectButtonController'
import { service } from '../../helpers/mockData'

describe('components/ConnectButtonController', () => {
  test('should not explode', () => {
    mount(<ConnectButtonController service={service()} />)
  })
})
