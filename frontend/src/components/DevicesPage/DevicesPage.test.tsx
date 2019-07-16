import React from 'react'
import { mount } from 'enzyme'
import { DevicesPage } from './DevicesPage'
import { boolean, text } from '@storybook/addon-knobs'

describe('components/DevicesPage', () => {
  test('should not explode', () => {
    mount(
      <DevicesPage
        allDevices={[]}
        visibleDevices={[]}
        fetch={jest.fn()}
        localSearch={jest.fn()}
        remoteSearch={jest.fn()}
        fetching={boolean('fetching', false)}
        searchPerformed={boolean('searchPerformed', false)}
        user={undefined}
        query={text('query', '')}
        searchOnly={boolean('searchOnly', false)}
        setQuery={jest.fn()}
        searching={boolean('searching', false)}
      />
    )
  })
})
