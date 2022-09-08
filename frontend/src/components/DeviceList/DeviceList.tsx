import React from 'react'
import classnames from 'classnames'
import { DeviceContext } from '../../services/Context'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { DeviceListHeader } from '../DeviceListHeader'
import { makeStyles } from '@mui/styles'
import { List } from '@mui/material'
import { DeviceListItem } from '../DeviceListItem'
import { Attribute } from '../Attributes'
import { isOffline } from '../../models/devices'
import { GuideStep } from '../GuideStep'
import { LoadMore } from '../LoadMore'
import { spacing, fontSizes } from '../../styling'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  attributes: Attribute[]
  required: Attribute
  columnWidths: ILookup<number>
  fetching?: boolean
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
  selected?: string[]
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices = [],
  connections = {},
  attributes,
  columnWidths,
  fetching,
  required,
  restore,
  select,
  selected = [],
}) => {
  const css = useStyles({ attributes, required: required, columnWidths })
  const dispatch = useDispatch<Dispatch>()
  return (
    <>
      <List className={classnames(css.list, css.grid)} disablePadding>
        <DeviceListHeader {...{ devices, required, attributes, select, fetching, columnWidths }} />
        <GuideStep
          guide="aws"
          step={3}
          placement="bottom"
          instructions="Click on the Guest VPC device to continue."
          highlight
          autoNext
        >
          {devices?.map(device => {
            const canRestore = isOffline(device) && !device.shared
            const isSelected = selected?.includes(device.id)
            if (restore && !canRestore) return null
            return (
              <DeviceContext.Provider
                key={device.id}
                value={{ device, connections: connections[device.id], required, attributes }}
              >
                <DeviceListItem
                  restore={restore && canRestore}
                  select={select}
                  selected={isSelected}
                  onSelect={deviceId => {
                    if (isSelected) {
                      const index = selected.indexOf(deviceId)
                      selected.splice(index, 1)
                    } else {
                      selected.push(deviceId)
                    }
                    dispatch.ui.set({ selected: [...selected] })
                  }}
                />
              </DeviceContext.Provider>
            )
          })}
        </GuideStep>
      </List>
      <LoadMore />
      <ServiceContextualMenu />
    </>
  )
}

type StyleProps = {
  attributes: Attribute[]
  required: Attribute
  columnWidths: ILookup<number>
}

const useStyles = makeStyles(({ palette }) => ({
  grid: ({ attributes, required, columnWidths }: StyleProps) => ({
    minWidth: '100%',
    width: required.width(columnWidths) + attributes?.reduce((w, a) => w + a.width(columnWidths), 0),
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      gridTemplateColumns: `${required.width(columnWidths)}px ${attributes
        ?.map(a => a.width(columnWidths))
        .join('px ')}px`,
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
    '& .MuiBox-root': {
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
