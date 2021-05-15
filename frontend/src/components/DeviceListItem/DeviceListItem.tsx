import React from 'react'
import { AttributeValue } from '../AttributeValue'
import { DeviceLabel } from '../DeviceLabel'
import { RestoreButton } from '../../buttons/RestoreButton'
import { ListItemLocation } from '../ListItemLocation'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { Attribute } from '../../helpers/attributes'
import { makeStyles, ListItemIcon, ListItemSecondaryAction, useMediaQuery } from '@material-ui/core'
import { spacing, colors, fontSizes } from '../../styling'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
  restore?: boolean
  setContextMenu: React.Dispatch<React.SetStateAction<IContextMenu>>
  attributes?: Attribute[]
}

export const DeviceListItem: React.FC<Props> = ({
  device,
  connections,
  thisDevice,
  setContextMenu,
  attributes = [],
  restore,
}) => {
  const connected = connections && connections.find(c => c.enabled)
  const largeScreen = useMediaQuery('(min-width:600px)')
  const css = useStyles({ attributes })

  if (!device) return null

  return (
    <ListItemLocation pathname={`/devices/${device.id}`} className={css.columns}>
      <DeviceLabel device={device} />
      <ListItemIcon>
        <ConnectionStateIcon device={device} connection={connected} size="lg" thisDevice={thisDevice} />
      </ListItemIcon>
      {restore ? (
        <>
          <AttributeValue device={device} connection={connected} attribute={attributes[0]} />
          <ListItemSecondaryAction>
            <RestoreButton device={device} />
          </ListItemSecondaryAction>
        </>
      ) : (
        largeScreen &&
        attributes?.map(attribute => (
          <AttributeValue
            key={attribute.id}
            device={device}
            connection={connected}
            connections={connections}
            attribute={attribute}
          />
        ))
      )}
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  columns: ({ attributes }: { attributes: Props['attributes'] }) => ({
    display: 'grid',
    gridGap: spacing.md,
    gridTemplateColumns: `auto ${attributes?.map(a => a.width).join(' ')}`,
    alignItems: 'center',
    height: 42,
    '& .MuiBox-root': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: colors.grayDarker,
      fontSize: fontSizes.sm,
    },
    '& .attribute-deviceName': {
      marginLeft: -spacing.md,
      marginRight: -spacing.md,
    },
  }),
})
