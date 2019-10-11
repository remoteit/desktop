import React, { useState } from 'react'
import { List, ListItem, ListItemText, ListItemIcon, Collapse, Button, Link, Typography } from '@material-ui/core'
import { Icon } from '../../components/Icon'
import { makeStyles } from '@material-ui/styles'
import { serviceTypes } from '../config/serviceTypes'
import defaults from '../common/defaults'
import styles from '../../styling'

type Props = {
  data: IScan[]
  targets: ITarget[]
  interfaceType: IInterfaceType
  onAdd: (target: ITarget) => void
}

type IInterfaceIcon = { [interfaceType in IInterfaceType]: any }

const InterfaceIcon: IInterfaceIcon = {
  Wireless: <Icon name="wifi" weight="solid" />,
  Wired: <Icon name="ethernet" weight="solid" />,
  FireWire: <Icon name="fire" weight="solid" />,
  Thunderbolt: <Icon name="bolt" weight="solid" />,
  Bluetooth: <Icon name="bluetooth-b" weight="solid" />,
  Other: <Icon name="usb" weight="solid" />,
}

const ScanNetwork: React.FC<Props> = ({ data, targets, interfaceType, onAdd }) => {
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
          {allClosed ? <Icon name="angle-down" inline /> : <Icon name="angle-up" inline />}
        </Link>
      </div>
      {data.map((ip, row) => (
        <List key={row} className={css.list}>
          <ListItem button onClick={() => toggle(row)}>
            <ListItemIcon>{InterfaceIcon[interfaceType]}</ListItemIcon>
            <ListItemText primary={ip[0]} />
            {open.includes(row) ? <Icon name="angle-up" /> : <Icon name="angle-down" />}
          </ListItem>
          <Collapse in={open.includes(row)} timeout="auto">
            {ip[1].map((port, key) => (
              <ListItem key={key} dense className={css.port}>
                <ListItemText primary={port[0]} />
                <ListItemText primary={port[1]} />
                {targets.find(target => target.hostname === ip[0] && target.port === port[0]) ? (
                  <Button disabled size="small">
                    Added
                    <Icon name="check" />
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    variant="contained"
                    size="small"
                    disabled={disabled}
                    onClick={() =>
                      onAdd({
                        ...defaults,
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
              </ListItem>
            ))}
          </Collapse>
        </List>
      ))}
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
    // marginBottom: -styles.spacing.xl,
    marginLeft: styles.spacing.sm,
    marginRight: styles.spacing.sm,
  },
  toggle: {
    padding: '6px 12px 12px 22px',
    '& .MuiSvgIcon-root': {
      marginBottom: -6,
      marginLeft: styles.spacing.sm,
    },
  },
  list: {
    borderTop: `1px solid ${styles.colors.grayLighter}`,
  },
  port: {
    paddingLeft: 74,
    paddingRight: styles.spacing.lg,
    '& div.MuiListItemText-root:nth-child(1)': {
      maxWidth: '20%',
    },
  },
  loading: {
    alignItems: 'center',
    flexDirection: 'column',
    '& p': {
      fontSize: styles.fontSizes.sm,
      margin: styles.spacing.lg,
      color: styles.colors.grayLight,
    },
  },
})
