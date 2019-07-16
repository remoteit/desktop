import React from 'react'
import { mount } from 'enzyme'
import { DebugLogItem } from './DebugLogItem'
import { log } from '../../helpers/mockData'

describe('components/DebugLogItem', () => {
  test('should not explode', () => {
    mount(<DebugLogItem log={log()} />)
  })
})
