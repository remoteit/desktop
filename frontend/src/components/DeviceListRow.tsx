import React from 'react'
import { Link } from 'react-router-dom'
import { AttributeValue } from './AttributeValue'
import { DeviceLabel } from './DeviceLabel'
import { RestoreButton } from '../buttons/RestoreButton'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { Attribute } from '../helpers/attributes'
import { makeStyles, ListItem, ListItemSecondaryAction, ListItemIcon, Button, useMediaQuery } from '@material-ui/core'
import { spacing, colors, fontSizes } from '../styling'
import { GridRowData } from '@material-ui/data-grid'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  thisDevice?: boolean
  restore?: boolean
  attributes?: Attribute[]
}

export const DeviceListRow = ({ device, connections, thisDevice, attributes = [], restore }: Props): GridRowData => {
  const connected = connections && connections.find(c => c.enabled)
  const largeScreen = useMediaQuery('(min-width:600px)')
  // const css = useStyles({ attributes })

  if (!device) return {}

  let data: GridRowData = {
    id: device.id,
    connectionStateIcon: { device, connected, thisDevice },
  }

  if (restore) {
    data[attributes[0].id] = <AttributeValue device={device} connection={connected} attribute={attributes[0]} />
    data.restore = <RestoreButton device={device} />
  } else if (largeScreen) {
    attributes?.forEach(attribute => {
      data[attribute.id] = (
        <AttributeValue device={device} connection={connected} connections={connections} attribute={attribute} />
      )
    })
  }

  console.log('DEVICE LIST ROW DATA', data)

  return data
}

/* <ListItem className={css.columns} to={`/devices/${device.id}`} component={Link} button> */

// const useStyles = makeStyles({
//   button: {
//     position: 'absolute',
//     height: '100%',
//     zIndex: 0,
//   },
//   columns: ({ attributes }: { attributes: Props['attributes'] }) => ({
//     display: 'grid',
//     gridGap: spacing.md,
//     gridTemplateColumns: `auto ${attributes?.map(a => a.width).join(' ')}`,
//     alignItems: 'center',
//     height: 42,
//     '& .MuiBox-root': {
//       overflow: 'hidden',
//       textOverflow: 'ellipsis',
//       whiteSpace: 'nowrap',
//       color: colors.grayDarker,
//       fontSize: fontSizes.sm,
//     },
//     '& .attribute-deviceName': {
//       marginLeft: -spacing.md,
//       marginRight: -spacing.md,
//     },
//   }),
// })
