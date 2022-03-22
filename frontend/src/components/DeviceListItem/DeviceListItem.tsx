import React from 'react'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from '../AttributeValue'
import { makeStyles, Box, ListItemIcon, ListItem, useMediaQuery } from '@material-ui/core'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { RestoreButton } from '../../buttons/RestoreButton'
import { Attribute } from '../Attributes'
import { radius, spacing } from '../../styling'
import { Icon } from '../Icon'

type Props = {
  device?: IDevice
  connections?: IConnection[]
  primary?: Attribute
  attributes?: Attribute[]
  restore?: boolean
  select?: boolean
  selected?: boolean
  onSelect?: (deviceId: string) => void
}

export const DeviceListItem: React.FC<Props> = ({
  device,
  connections,
  primary,
  attributes = [],
  restore,
  select,
  selected = false,
  onSelect,
}) => {
  const connected = connections && connections.find(c => c.enabled)
  const largeScreen = useMediaQuery('(min-width:600px)')
  const history = useHistory()
  const offline = device?.state === 'inactive'
  const css = useStyles({ offline })

  if (!device) return null

  const handleClick = () => {
    if (select) onSelect && onSelect(device.id)
    else history.push(`/devices/${device.id}`)
  }

  return (
    <ListItem className={css.row} onClick={handleClick} selected={selected} button disableGutters>
      <Box className={css.sticky}>
        {/* <DeviceLabel device={device} /> */}
        <ListItemIcon>
          {select ? (
            selected ? (
              <Icon name="check-square" size="md" type="solid" color="primary" />
            ) : (
              <Icon name="square" size="md" type="light" />
            )
          ) : (
            <ConnectionStateIcon device={device} connection={connected} />
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
    '& > div:first-child': { background: palette.white.main },
    '&:hover > div:first-child': { background: palette.primaryHighlight.main },
    '&.Mui-selected > div:first-child': { background: palette.primaryHighlight.main },
    '&.Mui-selected:hover > div:first-child': { background: palette.primaryLighter.main },
    '& > div:first-child > *': { opacity: offline ? 0.3 : 1 },
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  }),
  sticky: {
    position: 'sticky',
    left: 0,
    zIndex: 4,
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
