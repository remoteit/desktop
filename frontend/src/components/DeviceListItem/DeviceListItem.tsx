import React, { useContext } from 'react'
import { DeviceListContext } from '../../services/Context'
import { useHistory } from 'react-router-dom'
import { AttributeValue } from '../AttributeValue'
import { makeStyles } from '@mui/styles'
import { Box, ListItemIcon, ListItem } from '@mui/material'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { DeviceConnectMenu } from '../DeviceConnectMenu'
import { radius, spacing } from '../../styling'
import { TestUI } from '../TestUI'
import { Icon } from '../Icon'

type Props = {
  restore?: boolean
  select?: boolean
  selected?: boolean
  onSelect?: (deviceId: string) => void
}

export const DeviceListItem: React.FC<Props> = ({ restore, select, selected = false, onSelect }) => {
  const { connections, device, attributes, required } = useContext(DeviceListContext)
  const connection = connections && connections.find(c => c.enabled)
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
            <>
              <ConnectionStateIcon /* className="hoverHide" */ device={device} connection={connection} />
              {/* <TestUI>
                <Box className={css.connect}>
                  <DeviceConnectMenu size="icon" iconSize="md" disabled={offline || device.thisDevice} />
                </Box>
              </TestUI> */}
            </>
          )}
        </ListItemIcon>
        <AttributeValue attribute={required} connection={connection} />
      </Box>
      {attributes?.map(attribute => (
        <Box key={attribute.id}>
          <AttributeValue attribute={attribute} connection={connection} />
        </Box>
      ))}
    </ListItem>
  )
}

type StyleProps = {
  offline: boolean
}

const useStyles = makeStyles(({ palette }) => ({
  row: ({ offline }: StyleProps) => ({
    '&:hover > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)`,
    },
    '&.Mui-selected > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryHighlight.main} 95%, transparent)`,
    },
    '&.Mui-selected:hover > div:first-of-type': {
      backgroundImage: `linear-gradient(90deg, ${palette.primaryLighter.main} 95%, transparent)`,
    },
    '& > div:first-of-type > *': { opacity: offline ? 0.3 : 1 },
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
  connect: {
    top: 0,
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    width: 62,
    height: '100%',
    '& .MuiIconButton-root': {
      backgroundImage: `radial-gradient(${palette.white.main} 15%, transparent 85%)`,
    },
  },
}))
