import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse,
  Button,
  Chip,
  Typography,
  Box,
} from '@mui/material'
import { Icon } from '../Icon'
import { getType } from '../../models/applicationTypes'
import { REGEX_LAST_PATH } from '../../constants'
import { IP_PRIVATE, REGEX_NAME_SAFE } from '@common/constants'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../../store'
import { spacing } from '../../styling'

type Props = {
  data: IScan[]
  services: IService[]
  interfaceType: IInterfaceType
  privateIP: string
}

type IInterfaceIcon = { [interfaceType in IInterfaceType]: any }

const InterfaceIcon: IInterfaceIcon = {
  Wireless: <Icon name="wifi" type="regular" />,
  Wired: <Icon name="ethernet" type="regular" />,
  FireWire: <Icon name="fire" type="regular" />,
  Thunderbolt: <Icon name="bolt" type="regular" />,
  Bluetooth: <Icon name="bluetooth-b" type="regular" />,
  Other: <Icon name="usb" type="brands" />,
}

export const ScanNetwork: React.FC<Props> = ({ data, services, interfaceType, privateIP }) => {
  const history = useHistory()
  const location = useLocation()
  const { ui } = useDispatch<Dispatch>()
  const [open, setOpen] = useState<number[]>([])
  const { applicationTypes, setupServicesLimit } = useSelector((state: State) => ({
    applicationTypes: state.applicationTypes.all,
    setupServicesLimit: state.ui.setupServicesLimit,
  }))
  const allClosed = open.length === 0
  const disabled = services.length + 1 > setupServicesLimit

  function toggle(row: number) {
    const index = open.indexOf(row)

    if (index === -1) {
      setOpen([...open, row])
    } else {
      open.splice(index, 1)
      setOpen([...open])
    }
  }

  function toggleAll() {
    if (allClosed) {
      setOpen(Array.from(Array(data.length).keys()))
    } else {
      setOpen([])
    }
  }

  function isAdded(ip: string, port: number) {
    return services.find(
      service => (service.host === ip || (IP_PRIVATE === service.host && privateIP === ip)) && service.port === port
    )
  }

  return (
    <>
      <Box
        sx={theme => ({
          color: theme.palette.gray.main,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        })}
      >
        <Typography variant="subtitle1" gutterBottom>
          Add a service
        </Typography>
        <Chip
          size="small"
          onClick={toggleAll}
          sx={{ marginRight: `${spacing.md}px` }}
          label={
            <>
              {allClosed ? 'Expand All' : 'Close All'}
              {allClosed ? <Icon name="chevron-down" size="xs" inline /> : <Icon name="chevron-up" size="xs" inline />}
            </>
          }
        />
      </Box>
      <List>
        {data.map((ip, row) => (
          <span key={row}>
            <ListItemButton onClick={() => toggle(row)}>
              <ListItemIcon>
                {ip[0] === privateIP ? <Icon name="router" type="regular" /> : InterfaceIcon[interfaceType]}
              </ListItemIcon>
              <ListItemText primary={ip[0]} secondary={ip[0] === privateIP ? 'This system' : null} />
              <ListItemSecondaryAction>
                <Icon name={open.includes(row) ? 'chevron-up' : 'chevron-down'} color="gray" />
              </ListItemSecondaryAction>
            </ListItemButton>
            <Collapse in={open.includes(row)}>
              {ip[1].map((port, key) => (
                <ListItem
                  key={key}
                  dense
                  sx={{
                    paddingLeft: '70px',
                    paddingRight: `${spacing.lg}px`,
                    '& div.MuiListItemText-root:nth-child(1)': { maxWidth: '20%' },
                  }}
                >
                  <ListItemText primary={port[0]} />
                  <ListItemText primary={port[1]} />
                  <ListItemSecondaryAction sx={{ right: spacing.lg }}>
                    {isAdded(ip[0], port[0]) ? (
                      <Button disabled size="small">
                        Added
                        <Icon name="check" inline />
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        variant="contained"
                        size="small"
                        disabled={disabled}
                        onClick={() => {
                          ui.set({
                            setupAdded: {
                              typeID: getType(applicationTypes, port[0]),
                              host: ip[0] === privateIP ? IP_PRIVATE : ip[0],
                              port: port[0],
                              name: (ip[0] === privateIP ? '' : 'Forwarded ') + port[1].replace(REGEX_NAME_SAFE, ''),
                            },
                          })
                          history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
                        }}
                      >
                        Add
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </Collapse>
          </span>
        ))}
      </List>
    </>
  )
}

