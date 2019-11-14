import React, { useState } from 'react'
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse,
  Button,
  Link,
  Typography,
} from '@material-ui/core'
import { Icon } from '../Icon'
import { makeStyles } from '@material-ui/styles'
import { serviceTypes } from '../../types/serviceTypes'
import { DEFAULT_TARGET } from '../../constants'
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

const ScanNetwork: React.FC<Props> = ({ data, targets, interfaceType, onAdd, privateIP }) => {
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
    return type ? type.id : 1
  }

  return (
    <>
      <div className={css.caption}>
        <Typography variant="caption">Select a device to add a jump connection</Typography>
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
                {open.includes(row) ? <Icon name="chevron-up" /> : <Icon name="chevron-down" />}
              </ListItemSecondaryAction>
            </ListItem>
            <Collapse in={open.includes(row)} timeout="auto">
              {ip[1].map((port, key) => (
                <ListItem key={key} dense className={css.port}>
                  <ListItemText primary={port[0]} />
                  <ListItemText primary={port[1]} />
                  <ListItemSecondaryAction>
                    {targets.find(target => target.hostname === ip[0] && target.port === port[0]) ? (
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
                            hostname: ip[0],
                            port: port[0],
                            name: port[1],
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

export default ScanNetwork

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
    paddingLeft: 54,
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
