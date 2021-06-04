import React from 'react'
import { Link } from 'react-router-dom'
import { AttributeValue } from '../AttributeValue'
import { DeviceLabel } from '../DeviceLabel'
import { RestoreButton } from '../../buttons/RestoreButton'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { Attribute } from '../../helpers/attributes'
import { makeStyles, ListItem, ListItemSecondaryAction, ListItemIcon, Button, useMediaQuery } from '@material-ui/core'
import { spacing, colors, fontSizes } from '../../styling'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
  restore?: boolean
  attributes?: Attribute[]
}

export const DeviceListItem: React.FC<Props> = ({ device, connections, thisDevice, attributes = [], restore }) => {
  const connected = connections && connections.find(c => c.enabled)
  const largeScreen = useMediaQuery('(min-width:600px)')
  const css = useStyles({ attributes })

  if (!device) return null

  return (
    <>
      <ListItem className={css.columns} to={`/devices/${device.id}`} component={Link} button>
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
      </ListItem>
    </>
  )
}

const useStyles = makeStyles({
  button: {
    position: 'absolute',
    height: '100%',
    zIndex: 0,
  },
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
