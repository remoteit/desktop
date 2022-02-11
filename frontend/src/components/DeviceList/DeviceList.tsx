import React from 'react'
import { ServiceContextualMenu } from '../ServiceContextualMenu'
import { DeviceListHeader } from '../DeviceListHeader'
import { DeviceListItem } from '../DeviceListItem'
import { Attribute } from '../../helpers/attributes'
import { isOffline } from '../../models/devices'
import { GuideStep } from '../GuideStep'
import { LoadMore } from '../LoadMore'
import { makeStyles, List } from '@material-ui/core'
import { spacing, fontSizes } from '../../styling'

export interface DeviceListProps {
  connections: { [deviceID: string]: IConnection[] }
  attributes: Attribute[]
  primary?: Attribute
  devices?: IDevice[]
  restore?: boolean
  select?: boolean
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices = [],
  connections = {},
  attributes,
  primary,
  restore,
  select,
}) => {
  const css = useStyles({ attributes, primary })

  return (
    <>
      <List className={css.grid}>
        <DeviceListHeader primary={primary} attributes={attributes} select={select} />
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
    boxShadow: `inset 0px 0px 14px 2px ${palette.white.main}`,
    '& .MuiListItem-root': {
      display: 'grid',
      gridGap: spacing.md,
      gridTemplateColumns: `auto ${primary?.width} ${attributes?.map(a => a.width).join(' ')}`,
      alignItems: 'center',
      height: 42,
    },
    '& .MuiBox-root': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: fontSizes.sm,
    },
  }),
}))
