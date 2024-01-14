import React from 'react'
import browser from '../services/Browser'
import classnames from 'classnames'
import { selectServiceListAttributes } from '../selectors/devices'
import { masterAttributes, restoreAttributes } from './Attributes'
import { MOBILE_WIDTH } from '../constants'
import { DeviceListContext } from '../services/Context'
import { Dispatch, ApplicationState } from '../store'
import { useDispatch, useSelector } from 'react-redux'
import { DeviceListHeader } from './DeviceListHeader'
import { makeStyles } from '@mui/styles'
import { Box, List, Typography, useMediaQuery } from '@mui/material'
import { DeviceListItem } from './DeviceListItem'
import { Attribute } from './Attributes'
import { isOffline } from '../models/devices'
import { GuideBubble } from './GuideBubble'
import { LoadMore } from './LoadMore'
import { spacing, fontSizes } from '../styling'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  columnWidths: ILookup<number>
  fetching?: boolean
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
  selected?: string[]
}

export const ServiceList: React.FC<DeviceListProps> = ({
  devices = [],
  connections = {},
  columnWidths,
  fetching,
  restore,
  select,
  selected = [],
}) => {
  const { attributes, required } = useSelector((state: ApplicationState) => ({
    attributes: restore ? restoreAttributes : selectServiceListAttributes(state),
    required: masterAttributes.find(a => a.required) || masterAttributes[0],
  }))
  const mobile = useMediaQuery(`(max-width:${MOBILE_WIDTH}px)`)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ attributes, required, columnWidths, mobile })

  return (
    <List className={classnames(css.list, css.grid)} disablePadding>
      <DeviceListContext.Provider value={{ device: devices[0] }}>
        <DeviceListHeader {...{ devices, required, attributes, select, fetching, columnWidths, mobile }} />
      </DeviceListContext.Provider>
      {devices?.map((device, index) => {
        const canRestore = isOffline(device) && !device.shared
        const isSelected = selected?.includes(device.id)
        if (restore && !canRestore) return null
        const onSelect = deviceId => {
          const select = [...selected]
          if (isSelected) {
            const index = select.indexOf(deviceId)
            select.splice(index, 1)
          } else {
            select.push(deviceId)
          }
          dispatch.ui.set({ selected: select })
        }
        return (
          <DeviceListContext.Provider
            key={device.id}
            value={{ device, connections: connections[device.id], required, attributes }}
          >
            <DeviceListItem
              restore={restore && canRestore}
              select={select}
              selected={isSelected}
              onSelect={onSelect}
              mobile={mobile}
              onClick={index ? undefined : () => dispatch.ui.pop('deviceList')}
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
      '&:hover': { backgroundColor: palette.primaryHighlight.main },
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
