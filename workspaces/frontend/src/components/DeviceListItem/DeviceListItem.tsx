import React from 'react'
import { Link } from 'react-router-dom'
import { AttributeValue } from '../AttributeValue'
import { DeviceLabel } from '../DeviceLabel'
import { RestoreButton } from '../../buttons/RestoreButton'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { Attribute } from '../../helpers/attributes'
import { Icon } from '../Icon'
import { makeStyles, Checkbox, ListItemSecondaryAction, ListItemIcon, ListItem, useMediaQuery } from '@material-ui/core'
import { spacing, fontSizes } from '../../styling'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  primary?: Attribute
  attributes?: Attribute[]
  restore?: boolean
  select?: boolean
}

export const DeviceListItem: React.FC<Props> = ({ device, connections, primary, attributes = [], restore, select }) => {
  const connected = connections && connections.find(c => c.enabled)
  const largeScreen = useMediaQuery('(min-width:600px)')
  const css = useStyles({ attributes })
  if (!device) return null

  return (
    <>
      <ListItem className={css.columns} to={`/devices/${device.id}`} component={Link} button>
        {select && (
          <Checkbox
            // checked={checked}
            // indeterminate={indeterminate}
            // inputRef={inputRef}
            // onChange={event => onClick(event.target.checked)}
            className={css.checkbox}
            onClick={event => event.stopPropagation()}
            checkedIcon={<Icon name="check-square" size="md" type="solid" />}
            indeterminateIcon={<Icon name="minus-square" size="md" type="solid" />}
            icon={<Icon name="square" size="md" />}
            color="primary"
          />
        )}
        <DeviceLabel device={device} />
        <ListItemIcon>
          <ConnectionStateIcon device={device} connection={connected} size="lg" />
        </ListItemIcon>
        <AttributeValue device={device} connection={connected} attribute={primary} />
        <ListItemSecondaryAction className={css.column}>
          {restore ? (
            <RestoreButton device={device} />
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
        </ListItemSecondaryAction>
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
  checkbox: {
    maxWidth: 60,
  },
  column: ({ attributes }: { attributes: Props['attributes'] }) => ({
    // display: 'flex',
    // flexDirection: 'row-reverse',
    // width: '60%',
    display: 'grid',
    gridGap: spacing.md,
    gridTemplateColumns: `${attributes?.map(a => a.width).join(' ')}`,
  }),
  columns: {
    // display: 'grid',
    // gridGap: spacing.md,
    // gridTemplateColumns: `auto ${attributes?.map(a => a.width).join(' ')}`,
    alignItems: 'center',
    height: 42,
    '& .MuiBox-root': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: fontSizes.sm,
    },
  },
})
