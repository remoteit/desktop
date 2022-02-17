import React from 'react'
import { Link } from 'react-router-dom'
import { AttributeValue } from '../AttributeValue'
import { makeStyles, Checkbox, Box, ListItemIcon, ListItem, useMediaQuery } from '@material-ui/core'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { RestoreButton } from '../../buttons/RestoreButton'
import { DeviceLabel } from '../DeviceLabel'
import { Attribute } from '../../helpers/attributes'
import { radius, spacing } from '../../styling'
import { Icon } from '../Icon'

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
  const offline = device?.state === 'inactive'
  const css = useStyles({ offline })
  if (!device) return null

  return (
    <ListItem className={css.row} to={`/devices/${device.id}`} component={Link} button disableGutters>
      <Box className={css.sticky}>
        <DeviceLabel device={device} />
        <ListItemIcon>
          {select ? (
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
          ) : (
            <ConnectionStateIcon device={device} connection={connected} size="lg" />
          )}
        </ListItemIcon>
        <AttributeValue device={device} connection={connected} attribute={primary} />
      </Box>
      {restore ? (
        <RestoreButton device={device} />
      ) : (
        largeScreen &&
        attributes?.map(attribute => (
          <Box key={attribute.id}>
            <AttributeValue device={device} connection={connected} connections={connections} attribute={attribute} />
          </Box>
        ))
      )}
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  row: ({ offline }: { offline: boolean }) => ({
    '& > div:not(:first-child)': { opacity: offline ? 0.3 : 1 },
    '& > div:first-child > div ': { opacity: offline ? 0.3 : 1 },

    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  }),
  sticky: {
    position: 'sticky',
    left: 0,
    zIndex: 4,
    background: palette.white.main,
    display: 'flex',
    alignItems: 'center',
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
    overflow: 'visible',
    paddingLeft: spacing.md,
  },
  button: {
    position: 'absolute',
    height: '100%',
    zIndex: 0,
  },
  checkbox: {
    maxWidth: 60,
  },
}))
