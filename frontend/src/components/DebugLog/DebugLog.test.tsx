import React from 'react'
import { mount } from 'enzyme'
import { DebugLog } from './DebugLog'
import { log } from '../../helpers/mockData'

describe('components/DebugLog', () => {
  test('should not explode', () => {
    mount(<DebugLog logs={[log('Hello'), log('World')]} />)
  })
})
