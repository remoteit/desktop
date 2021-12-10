import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Divider,
  Button,
  Link,
  Typography,
} from '@material-ui/core'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/core/styles'
import { getTypeId } from '../../models/applicationTypes'
import { DEFAULT_TARGET, REGEX_NAME_SAFE, REGEX_LAST_PATH, IP_PRIVATE } from '../../shared/constants'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import styles, { spacing } from '../../styling'

type Props = {
  data: IScan[]
  targets: ITarget[]
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

export const ScanNetwork: React.FC<Props> = ({ data, targets, interfaceType, privateIP }) => {
  const css = useStyles()
  const history = useHistory()
  const location = useLocation()
  const { ui } = useDispatch<Dispatch>()
  const [open, setOpen] = useState<number[]>([])
  const { applicationTypes, setupServicesLimit } = useSelector((state: ApplicationState) => ({
    applicationTypes: state.applicationTypes.all,
    setupServicesLimit: state.ui.setupServicesLimit,
  }))
  const allClosed = open.length === 0
  const disabled = targets.length + 1 > setupServicesLimit

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
    return targets.find(
      target => (target.hostname === ip || (IP_PRIVATE === target.hostname && privateIP === ip)) && target.port === port
    )
  }

  return (
    <>
      <Divider />
      <div className={css.caption}>
        <Typography variant="subtitle1" gutterBottom>
          Add a service
        </Typography>
        <Link onClick={toggleAll} color="inherit" component="button" className={css.toggle}>
          {allClosed ? 'Expand All' : 'Close All'}
          {allClosed ? <Icon name="chevron-down" inline /> : <Icon name="chevron-up" inline />}
        </Link>
      </div>
      <List>
        {data.map((ip, row) => (
          <span key={row}>
            <ListItem button onClick={() => toggle(row)}>
              <ListItemIcon>
                {ip[0] === privateIP ? <Icon name="hdd" type="regular" /> : InterfaceIcon[interfaceType]}
              </ListItemIcon>
              <ListItemText primary={ip[0]} secondary={ip[0] === privateIP ? 'This system' : null} />
              <ListItemSecondaryAction>
                <IconButton onClick={() => toggle(row)}>
                  {open.includes(row) ? <Icon name="chevron-up" size="md" /> : <Icon name="chevron-down" size="md" />}
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Collapse in={open.includes(row)} timeout="auto">
              {ip[1].map((port, key) => (
                <ListItem key={key} dense className={css.port}>
                  <ListItemText primary={port[0]} />
                  <ListItemText primary={port[1]} />
                  <ListItemSecondaryAction>
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
                              ...DEFAULT_TARGET,
                              type: getTypeId(applicationTypes, port[0]),
                              hostname: ip[0] === privateIP ? IP_PRIVATE : ip[0],
                              port: port[0],
                              name: (ip[0] === privateIP ? '' : 'Forwarded ') + port[1].replace(REGEX_NAME_SAFE, ''),
                            },
                          })
                          history.push(location.pathname.replace(REGEX_LAST_PATH, ''))
                        }}
                      >
                        Add
                        <Icon name="plus" size="sm" type="regular" inline />
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

const useStyles = makeStyles( ({ palette }) => ({
  caption: {
    color: palette.gray.main,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  toggle: {
    padding: '6px 22px 0px 22px',
    '& .MuiSvgIcon-root': {
      marginBottom: -6,
      marginLeft: spacing.sm,
    },
  },
  port: {
    paddingLeft: 70,
    paddingRight: spacing.lg,
    '& div.MuiListItemText-root:nth-child(1)': {
      maxWidth: '20%',
    },
  },
  loading: {
    alignItems: 'center',
    flexDirection: 'column',
    '& p': {
      fontSize: styles.fontSizes.sm,
      margin: spacing.lg,
      color: palette.grayLight.main,
    },
  },
}))
