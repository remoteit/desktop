import React from 'react'
import classnames from 'classnames'
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
  primary: Attribute
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
  primary,
  restore,
  select,
  selected = [],
}) => {
  const css = useStyles({ attributes, primary, columnWidths })
  const dispatch = useDispatch<Dispatch>()
  return (
    <>
      <List className={classnames(css.list, css.grid)} disablePadding>
        <DeviceListHeader
          devices={devices}
          primary={primary}
          attributes={attributes}
          select={select}
          fetching={fetching}
          columnWidths={columnWidths}
        />
        <GuideStep
          guide="guideAWS"
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
              <DeviceListItem
                key={device.id}
                device={device}
                connections={connections[device.id]}
                primary={primary}
                attributes={attributes}
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
  primary: Attribute
  columnWidths: ILookup<number>
}

const useStyles = makeStyles(({ palette }) => ({
  grid: ({ attributes, primary, columnWidths }: StyleProps) => ({
    minWidth: '100%',
    width: primary.width(columnWidths) + attributes?.reduce((w, a) => w + a.width(columnWidths), 0),
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      gridTemplateColumns: `${primary.width(columnWidths)}px ${attributes
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
