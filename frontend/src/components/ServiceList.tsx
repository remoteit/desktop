import React, { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MOBILE_WIDTH } from '../constants'
import { getSortOptions } from './SortServices'
import { selectDeviceModelAttributes } from '../selectors/devices'
import { DeviceListHeaderCheckbox } from './DeviceListHeaderCheckbox'
import { Divider, useMediaQuery } from '@mui/material'
import { DeviceListContext } from '../services/Context'
import { DeviceListItem } from './DeviceListItem'
import { Attribute } from './Attributes'
import { GridList } from './GridList'
import { LoadMore } from './LoadMore'

export interface DeviceListProps {
  attributes: Attribute[]
  required: Attribute
  applicationTypes?: number[]
  connections: { [deviceID: string]: IConnection[] }
  columnWidths: ILookup<number>
  fetching?: boolean
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
  selected?: string[]
}

export const ServiceList: React.FC<DeviceListProps> = ({
  attributes,
  required,
  applicationTypes,
  devices = [],
  connections = {},
  columnWidths,
  fetching,
  select,
  selected = [],
}) => {
  const { sortService } = getSortOptions(useSelector(selectDeviceModelAttributes).sortServiceOption)
  const location = useLocation()
  const previousName = useRef<string>('')
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)

  const rows = devices.reduce((row, device) => {
    const hasFilter = applicationTypes?.length
    const services = [...device.services].sort(sortService)
    for (const s of services) {
      if (!hasFilter) row.push([s, device])
      else if (applicationTypes.includes(s.typeID)) row.push([s, device])
    }
    return row
  }, [] as [IService, IDevice][])

  // Reset previous name when the list changes
  previousName.current = ''

  return (
    <GridList
      {...{ attributes, required, fetching, columnWidths, mobile, rowShrink: 6 }}
      headerIcon={<DeviceListHeaderCheckbox select={select} devices={devices} />}
      headerContextData={{ device: devices[0], service: devices[0].services[0] }}
      headerContextProvider={DeviceListContext.Provider}
    >
      {rows.map(([service, device]) => {
        const disabled = select && !device.scriptable && location.pathname.includes('scripts')
        const duplicateName = device.id === previousName.current
        const divider = !duplicateName && !!previousName.current
        previousName.current = device.id
        return (
          <DeviceListContext.Provider
            key={service.id}
            value={{ device, service, connections: connections[device.id], required, attributes }}
          >
            {divider && <Divider variant="inset" />}
            <DeviceListItem {...{ mobile, duplicateName, select, selected, disabled }} />
          </DeviceListContext.Provider>
        )
      })}
      <LoadMore />
    </GridList>
  )
}
