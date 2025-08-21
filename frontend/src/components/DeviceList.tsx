import React from 'react'
import browser from '../services/browser'
import { useLocation } from 'react-router-dom'
import { MOBILE_WIDTH } from '../constants'
import { DeviceListContext } from '../services/Context'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { DeviceListHeaderCheckbox } from './DeviceListHeaderCheckbox'
import { Typography, useMediaQuery } from '@mui/material'
import { DeviceListItem } from './DeviceListItem'
import { Attribute } from './Attributes'
import { isOffline } from '../models/devices'
import { GuideBubble } from './GuideBubble'
import { LoadMore } from './LoadMore'
import { GridList } from './GridList'

export interface DeviceListProps {
  attributes: Attribute[]
  required: Attribute
  connections: { [deviceID: string]: IConnection[] }
  columnWidths: ILookup<number>
  fetching?: boolean
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
  selected?: string[]
}

export const DeviceList: React.FC<DeviceListProps> = ({
  attributes,
  required,
  devices = [],
  connections = {},
  columnWidths,
  fetching,
  restore,
  select,
  selected = [],
}) => {
  const location = useLocation()
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()

  return (
    <GridList
      {...{ attributes, required, fetching, columnWidths, mobile }}
      headerIcon={<DeviceListHeaderCheckbox select={select} devices={devices} />}
      headerContextData={{ device: devices[0] }}
      headerContextProvider={DeviceListContext.Provider}
    >
      {devices?.map((device, index) => {
        const canRestore = isOffline(device) && !device.shared
        if (restore && !canRestore) return null
        const disabled = select && !device.scriptable && location.pathname.includes('scripts')
        return (
          <DeviceListContext.Provider
            key={device.id}
            value={{ device, connections: connections[device.id], required, attributes }}
          >
            <DeviceListItem
              restore={restore && canRestore}
              select={select}
              selected={selected}
              mobile={mobile}
              onClick={index ? undefined : () => dispatch.ui.pop('deviceList')}
              disabled={disabled}
            />
            {!index && (
              <GuideBubble
                enterDelay={400}
                guide="deviceList"
                placement="bottom"
                startDate={new Date('2022-09-20')}
                queueAfter={browser.hasBackend ? 'registerMenu' : 'addDevice'}
                instructions={
                  <>
                    <Typography variant="h3" gutterBottom>
                      <b>Access a device</b>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      A device can host it's own applications (services), or it can host another service on it's local
                      network.
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Select a device to connect to a service, or configure it.
                    </Typography>
                  </>
                }
              />
            )}
          </DeviceListContext.Provider>
        )
      })}
      <LoadMore />
    </GridList>
  )
}
