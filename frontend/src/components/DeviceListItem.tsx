import React, { useContext } from 'react'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { DeviceListContext } from '../services/Context'
import { AttributeValueMemo } from './AttributeValue'
import { Box, ListItemIcon, ListItemButton } from '@mui/material'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { radius, spacing } from '../styling'
import { Icon } from './Icon'

type Props = {
  restore?: boolean
  select?: boolean
  selected?: boolean
  mobile?: boolean
  duplicateName?: boolean
  onClick?: () => void
  onSelect?: (deviceId: string) => void
}

export const DeviceListItem: React.FC<Props> = ({
  restore,
  select,
  selected = false,
  mobile,
  duplicateName,
  onClick,
  onSelect,
}) => {
  const { connections, device, service, attributes, required } = useContext(DeviceListContext)
  const connection =
    connections && (service ? connections.find(c => c.id === service.id) : connections.find(c => c.enabled))
  const history = useHistory()
  const offline = device?.state === 'inactive'
  const css = useStyles({ offline })

  if (!device) return null

  const handleClick = () => {
    onClick?.()
    if (select) onSelect?.(device.id)
    else if (!restore) history.push(`/devices/${device.id}${service ? `/${service.id}/connect` : ''}`)
  }

  return (
    <ListItemButton className={css.row} onClick={handleClick} selected={selected} disableGutters>
      <Box className={css.sticky}>
        {duplicateName && !mobile ? null : (
          <Box>
            <ListItemIcon>
              {select ? (
                selected ? (
                  <Icon name="check-square" size="md" type="solid" color="primary" />
                ) : (
                  <Icon name="square" size="md" />
                )
              ) : (
                <ConnectionStateIcon className="hoverHide" device={device} connection={connection} />
              )}
            </ListItemIcon>
            <AttributeValueMemo {...{ mobile, device, service, connection, connections }} attribute={required} />
          </Box>
        )}
      </Box>
      {!mobile &&
        attributes?.map(attribute => (
          <Box key={attribute.id}>
            <AttributeValueMemo {...{ mobile, device, service, attribute, connection, connections }} />
          </Box>
        ))}
    </ListItemButton>
  )
}

type StyleProps = {
  offline: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  row: ({ offline }: StyleProps) => ({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    width: '100%',
    '&:hover': {
      backgroundColor: palette.primaryHighlight.main,
    },
    '&:hover > div:first-of-type, &.Mui-selected > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)`,
    },
    '&.Mui-selected:hover > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryLighter.main} 95%, transparent)`,
    },
    '& > div:first-of-type > div': {
      opacity: offline ? 0.5 : 1,
      width: '100%',
    },
  }),
  sticky: {
    position: 'sticky',
    left: 0,
    zIndex: 4,
    display: 'flex',
    alignItems: 'start !important',
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
    backgroundImage: `linear-gradient(90deg, ${palette.white.main} 95%, transparent)`,
    overflow: 'visible',
    paddingLeft: spacing.md,
    height: '100%',
  },
}))
