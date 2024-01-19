import React, { useState, useRef } from 'react'
import classnames from 'classnames'
import { MOBILE_WIDTH } from '../constants'
import { DeviceListContext } from '../services/Context'
import { DeviceListHeader } from './DeviceListHeader'
import { makeStyles } from '@mui/styles'
import { List, Divider, useMediaQuery } from '@mui/material'
import { DeviceListItem } from './DeviceListItem'
import { Attribute } from './Attributes'
import { LoadMore } from './LoadMore'
import { spacing, fontSizes } from '../styling'

export interface DeviceListProps {
  attributes: Attribute[]
  required: Attribute
  applicationType?: number
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
  applicationType,
  devices = [],
  connections = {},
  columnWidths,
  fetching,
}) => {
  const previousName = useRef<string>('')
  const [events, setEvents] = useState<boolean>(true)
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const css = useStyles({ attributes, required, columnWidths, mobile })

  const rows = devices.reduce((services, device) => {
    device.services.forEach(s => {
      if (applicationType === undefined) services.push([s, device])
      else if (s.typeID === applicationType) services.push([s, device])
    })
    return services
  }, [] as [IService, IDevice][])

  // Reset previous name when the list changes
  previousName.current = ''

  return (
    <List className={classnames(css.list, css.grid)} disablePadding>
      <DeviceListContext.Provider value={{ device: devices[0], service: devices[0].services[0] }}>
        <DeviceListHeader {...{ devices, required, attributes, fetching, columnWidths, mobile }} />
      </DeviceListContext.Provider>
      {rows?.map(([service, device]) => {
        const duplicateName = device.name === previousName.current
        const divider = !duplicateName && !!previousName.current
        previousName.current = device.name
        return (
          <DeviceListContext.Provider
            key={service.id}
            value={{ device, service, connections: connections[device.id], required, attributes, setEvents }}
          >
            {divider && <Divider variant="inset" />}
            <DeviceListItem {...{ mobile, duplicateName, events }} />
          </DeviceListContext.Provider>
        )
      })}
      <LoadMore />
    </List>
  )
}

type StyleProps = {
  attributes: Attribute[]
  required: Attribute
  columnWidths: ILookup<number>
  mobile?: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  grid: ({ attributes, required, columnWidths, mobile }: StyleProps) => ({
    minWidth: '100%',
    width: required.width(columnWidths) + (mobile ? 0 : attributes?.reduce((w, a) => w + a.width(columnWidths), 0)),
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      gridTemplateColumns: `${required.width(columnWidths)}px ${
        mobile ? '' : attributes?.map(a => a.width(columnWidths)).join('px ') + 'px'
      }`,
    },
  }),
  list: {
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      display: 'inline-grid',
      alignItems: 'start',
      '& > .MuiBox-root': {
        paddingRight: spacing.sm,
      },
    },
    '& .MuiListItem-root': {
      minHeight: 42,
      fontSize: fontSizes.base,
      color: palette.grayDarkest.main,
    },
    '& > * > .MuiBox-root, & > * > * > .MuiBox-root': {
      display: 'flex',
      alignItems: 'center',
      minHeight: 36,
    },
    '& .attribute': {
      display: 'block',
      minHeight: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
}))
