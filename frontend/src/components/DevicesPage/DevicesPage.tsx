import React from 'react'
import { DeviceList } from '../DeviceList'
import { IDevice } from 'remote.it'
import { FormControl, Input, InputAdornment } from '@material-ui/core'
import { Icon } from '../Icon'

export interface Props {
  devices: IDevice[]
}

export function DevicesPage({ devices }: Props) {
  return (
    <div className="h-100 p-md bg-gray-lighter">
      <div className="mx-auto my-md" style={{ maxWidth: '720px' }}>
        <div className="df ai-center mb-md">
          <h3 className="txt-md fw-lighter upper ls-lg gray-dark">
            Your Devices
          </h3>
          <FormControl className="ml-auto" style={{ minWidth: '300px' }}>
            <Input
              id="input-with-icon-adornment"
              startAdornment={
                <InputAdornment position="start">
                  <Icon name="search" />
                </InputAdornment>
              }
              placeholder="Search devices and services..."
            />
          </FormControl>
        </div>
        <div>
          <DeviceList className="bg-white bs-2" devices={devices} />
        </div>
      </div>
    </div>
  )
}
