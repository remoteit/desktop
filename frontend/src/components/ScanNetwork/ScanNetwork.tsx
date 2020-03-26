import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Collapse,
  Button,
  Link,
  Typography,
} from '@material-ui/core'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import { serviceTypes } from '../../services/serviceTypes'
import { DEFAULT_TARGET, REGEX_NAME_SAFE, IP_PRIVATE } from '../../constants'
import styles, { spacing } from '../../styling'

type Props = {
  data: IScan[]
  targets: ITarget[]
  interfaceType: IInterfaceType
  onAdd: (target: ITarget) => void
  privateIP: string
}

type IInterfaceIcon = { [interfaceType in IInterfaceType]: any }

const InterfaceIcon: IInterfaceIcon = {
  Wireless: <Icon name="wifi" weight="regular" />,
  Wired: <Icon name="ethernet" weight="regular" />,
  FireWire: <Icon name="fire" weight="regular" />,
  Thunderbolt: <Icon name="bolt" weight="regular" />,
  Bluetooth: <Icon name="bluetooth-b" weight="regular" />,
  Other: <Icon name="usb" weight="regular" />,
}

export const ScanNetwork: React.FC<Props> = ({ data, targets, interfaceType, onAdd, privateIP }) => {
  const css = useStyles()
  const [open, setOpen] = useState<number[]>([])
  const allClosed = open.length === 0
  const disabled = targets.length > 9

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

  function getType(port: number) {
    const type = serviceTypes.find(st => st.defaultPort === port)
    return type ? type.id : DEFAULT_TARGET.type
  }

  function isAdded(ip: string, port: number) {
    return targets.find(
      target => (target.hostname === ip || (IP_PRIVATE === target.hostname && privateIP === ip)) && target.port === port
    )
  }

  return (
    <>
      <div className={css.caption}>
        <Typography variant="caption">Select a device to add a hosted service</Typography>
        <Link onClick={toggleAll} color="inherit" component="button" className={css.toggle}>
          {allClosed ? 'Expand All' : 'Close All'}
          {allClosed ? <Icon name="chevron-down" inline /> : <Icon name="chevron-up" inline />}
        </Link>
      </div>
      <List className={css.list}>
        {data.map((ip, row) => (
          <span key={row}>
            <ListItem button onClick={() => toggle(row)}>
              <ListItemIcon>
                {ip[0] === privateIP ? <Icon name="hdd" weight="regular" /> : InterfaceIcon[interfaceType]}
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
                        onClick={() =>
                          onAdd({
                            ...DEFAULT_TARGET,
                            type: getType(port[0]),
                            hostname: ip[0] === privateIP ? '' : ip[0],
                            port: port[0],
                            name: (ip[0] === privateIP ? '' : 'Forwarded ') + port[1].replace(REGEX_NAME_SAFE, ''),
                          })
                        }
                      >
                        Add
                        <Icon name="plus" inline />
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

const useStyles = makeStyles({
  caption: {
    color: styles.colors.gray,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingLeft: spacing.lg,
  },
  toggle: {
    padding: '6px 22px 12px 22px',
    '& .MuiSvgIcon-root': {
      marginBottom: -6,
      marginLeft: spacing.sm,
    },
  },
  list: {
    borderTop: `1px solid ${styles.colors.grayLighter}`,
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
      color: styles.colors.grayLight,
    },
  },
})
