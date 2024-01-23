import React, { useRef } from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { MOBILE_WIDTH } from '../constants'
import { List, Divider, useMediaQuery } from '@mui/material'
import { spacing, fontSizes } from '../styling'
import { DeviceListContext } from '../services/Context'
import { DeviceListHeader } from './DeviceListHeader'
import { DeviceListItem } from './DeviceListItem'
import { Attribute } from './Attributes'
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
}) => {
  const previousName = useRef<string>('')
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const css = useStyles({ attributes, required, columnWidths, mobile })

  const rows = devices.reduce((services, device) => {
    const hasFilter = applicationTypes?.length
    device.services.forEach(s => {
      if (!hasFilter) services.push([s, device])
      else if (applicationTypes.includes(s.typeID)) services.push([s, device])
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
            value={{ device, service, connections: connections[device.id], required, attributes }}
          >
            {divider && <Divider variant="inset" />}
            <DeviceListItem {...{ mobile, duplicateName }} />
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

const ROW_HEIGHT = 42
const SHRINK = 8

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
    '& .MuiListItem-root:nth-child(2)': {
      marginTop: SHRINK / 2,
    },
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      display: 'inline-grid',
      alignItems: 'start',
      '& > .MuiBox-root': {
        paddingRight: spacing.sm,
      },
    },
    '& .MuiListItem-root': {
      minHeight: ROW_HEIGHT - SHRINK,
      fontSize: fontSizes.base,
      color: palette.grayDarkest.main,
    },
    '& > * > .MuiBox-root, & > * > * > .MuiBox-root': {
      display: 'flex',
      alignItems: 'center',
      minHeight: ROW_HEIGHT - 6 - SHRINK,
    },
    '& .attribute': {
      display: 'block',
      minHeight: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .MuiDivider-root': {
      marginTop: SHRINK / 2 - 1,
      marginBottom: SHRINK / 2 - 1,
    },
  },
}))