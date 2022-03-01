import React from 'react'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { DeviceListHeader } from '../DeviceListHeader'
import { makeStyles, List } from '@material-ui/core'
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
      <List className={css.grid} disablePadding>
        <DeviceListHeader
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
    display: 'inline-block',
    minWidth: '100%',
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      display: 'grid',
      gridTemplateColumns: `${primary.width(columnWidths)}px ${attributes
        ?.map(a => a.width(columnWidths))
        .join('px ')}px`,
      alignItems: 'center',
      '& > .MuiBox-root': {
        paddingRight: spacing.sm,
      },
    },
    '& .MuiListItem-root': {
      height: 42,
      fontSize: fontSizes.base,
      color: palette.grayDarkest.main,
    },
    '& .MuiBox-root': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  }),
}))
