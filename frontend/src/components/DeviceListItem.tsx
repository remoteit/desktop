import React, { useContext } from 'react'
import { makeStyles } from '@mui/styles'
import { useHistory } from 'react-router-dom'
import { DeviceListContext } from '../services/Context'
import { AttributeValueMemo } from './AttributeValue'
import { Box, ListItemIcon, ListItem } from '@mui/material'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { radius, spacing } from '../styling'
import { Icon } from './Icon'

type Props = {
  restore?: boolean
  select?: boolean
  selected?: boolean
  mobile?: boolean
  duplicateName?: boolean
  events?: boolean
  onClick?: () => void
  onSelect?: (deviceId: string) => void
}

export const DeviceListItem: React.FC<Props> = ({
  restore,
  select,
  selected = false,
  mobile,
  duplicateName,
  events,
  onClick,
  onSelect,
}) => {
  const { connections, device, service, attributes, required } = useContext(DeviceListContext)
  const connection =
    connections && (service ? connections.find(c => c.id === service.id) : connections.find(c => c.enabled))
  const history = useHistory()
  const offline = device?.state === 'inactive'
  const css = useStyles({ offline, events })

  if (!device) return null

  const handleClick = () => {
    onClick?.()
    if (select) onSelect?.(device.id)
    else if (!restore) history.push(`/devices/${device.id}${service ? `/${service.id}/connect` : ''}`)
  }

  return (
    <ListItem className={css.row} onClick={handleClick} selected={selected} button disableGutters>
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
    </ListItem>
  )
}

type StyleProps = {
  offline: boolean
  events?: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  row: ({ offline, events }: StyleProps) => ({
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    '&:hover': {
      backgroundColor: events ? palette.primaryHighlight.main : palette.white.main,
    },
    '&:hover > div:first-of-type, &.Mui-selected > div:first-of-type': {
      backgroundImage: events ? `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)` : undefined,
    },
    '&.Mui-selected:hover > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryLighter.main} 95%, transparent)`,
    },
    '& > div:first-of-type > div': {
      opacity: offline ? 0.5 : 1,
      width: '100%',
    },
  }),
  sticky: ({ events }: StyleProps) => ({
    position: 'sticky',
    left: 0,
    zIndex: 4,
    display: 'flex',
    alignItems: 'start !important',
    borderTopRightRadius: radius,
    borderBottomRightRadius: radius,
    backgroundImage: events ? `linear-gradient(90deg, ${palette.white.main} 95%, transparent)` : undefined,
    overflow: 'visible',
    paddingLeft: spacing.md,
    height: '100%',
  }),
}))
