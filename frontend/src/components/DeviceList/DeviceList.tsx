import React from 'react'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { DeviceListHeader } from '../DeviceListHeader'
import { makeStyles, List } from '@material-ui/core'
import { DeviceListItem } from '../DeviceListItem'
import { Attribute } from '../../helpers/attributes'
import { isOffline } from '../../models/devices'
import { GuideStep } from '../GuideStep'
import { LoadMore } from '../LoadMore'
import { spacing, fontSizes } from '../../styling'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  attributes: Attribute[]
  fetching?: boolean
  primary?: Attribute
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices = [],
  connections = {},
  attributes,
  fetching,
  primary,
  restore,
  select,
}) => {
  const css = useStyles({ attributes, primary })

  return (
    <>
      <List className={css.grid} disablePadding>
        <DeviceListHeader attributes={attributes} select={select} fetching={fetching} />
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
  primary?: Attribute
}

const useStyles = makeStyles(({ palette }) => ({
  grid: ({ attributes, primary }: StyleProps) => ({
    display: 'inline-block',
    minWidth: '100%',
    '& .MuiListItem-root, & .MuiListSubheader-root': {
      display: 'grid',
      gridGap: spacing.md,
      gridTemplateColumns: `${primary?.width} ${attributes?.map(a => a.width).join(' ')}`,
      alignItems: 'center',
    },
    '& .MuiListItem-root': {
      height: 42,
      fontSize: fontSizes.sm,
    },
    '& .MuiListSubheader-root': {
      marginLeft: spacing.xs,
      borderBottom: `1px solid ${palette.grayLighter.main}`,
    },
    '& .MuiBox-root': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  }),
}))
