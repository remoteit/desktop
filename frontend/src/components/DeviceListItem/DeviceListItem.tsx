import React from 'react'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from '../AttributeValue'
import { makeStyles, Box, ListItemIcon, ListItem } from '@material-ui/core'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
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
  const history = useHistory()
  const offline = device?.state === 'inactive'
  const css = useStyles({ offline })

  if (!device) return null

  const handleClick = () => {
    if (select) onSelect && onSelect(device.id)
    else if (!restore) history.push(`/devices/${device.id}`)
  }

  return (
    <ListItem className={css.row} onClick={handleClick} selected={selected} button disableGutters>
      <Box className={css.sticky}>
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
      {attributes?.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue device={device} connection={connected} connections={connections} attribute={attribute} />
        </Box>
      ))}
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  row: ({ offline }: { offline: boolean }) => ({
    '&:hover > div:first-child': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)`,
    },
    '&.Mui-selected > div:first-child': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)`,
    },
    '&.Mui-selected:hover > div:first-child': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryLighter.main} 95%, transparent)`,
    },
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
    backgroundImage: `linear-gradient(90deg, ${palette.white.main} 95%, transparent)`,
    overflow: 'visible',
    paddingLeft: spacing.md,
  },
}))
