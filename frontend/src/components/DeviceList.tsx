import React, { useCallback, useMemo } from 'react'
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
import { DeviceLoadMore } from './LoadMore'
import { GridList } from './GridList'

const GUIDE_START_DATE = new Date('2022-09-20')

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

type RowProps = {
  device: IDevice
  deviceConnections?: IConnection[]
  attributes: Attribute[]
  required: Attribute
  restore?: boolean
  canRestore: boolean
  select?: boolean
  mobile: boolean
  disabled?: boolean
  showGuide: boolean
  onClick?: () => void
}

const DeviceListRow: React.FC<RowProps> = React.memo(
  ({
    device,
    deviceConnections,
    attributes,
    required,
    restore,
    canRestore,
    select,
    mobile,
    disabled,
    showGuide,
    onClick,
  }) => {
    const value = useMemo(
      () => ({ device, connections: deviceConnections, required, attributes }),
      [device, deviceConnections, required, attributes]
    )
    return (
      <DeviceListContext.Provider value={value}>
        <DeviceListItem
          restore={restore && canRestore}
          select={select}
          mobile={mobile}
          onClick={onClick}
          disabled={disabled}
        />
        {showGuide && (
          <GuideBubble
            enterDelay={400}
            guide="deviceList"
            placement="bottom"
            startDate={GUIDE_START_DATE}
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
  }
)

export const DeviceList: React.FC<DeviceListProps> = ({
  attributes,
  required,
  devices = [],
  connections = {},
  columnWidths,
  fetching,
  restore,
  select,
}) => {
  const location = useLocation()
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const onFirstClick = useCallback(() => dispatch.ui.pop('deviceList'), [dispatch])
  const isScriptsPath = location.pathname.includes('scripts')

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
        const disabled = select && !device.scriptable && isScriptsPath
        return (
          <DeviceListRow
            key={device.id}
            device={device}
            deviceConnections={connections[device.id]}
            attributes={attributes}
            required={required}
            restore={restore}
            canRestore={canRestore}
            select={select}
            mobile={mobile}
            disabled={disabled}
            showGuide={!index}
            onClick={index ? undefined : onFirstClick}
          />
        )
      })}
      <DeviceLoadMore />
    </GridList>
  )
}
