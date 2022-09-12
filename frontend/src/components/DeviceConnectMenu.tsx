import classnames from 'classnames'
import React, { useState, useContext } from 'react'
import { isPortal } from '../services/Browser'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { DeviceContext } from '../services/Context'
import { newConnection } from '../helpers/connectionHelper'
import { Divider, Menu, MenuItem, ListSubheader, ListItemIcon, Fade, darken } from '@mui/material'
import { ConnectButton, ConnectButtonProps } from '../buttons/ConnectButton'
import { ServiceName } from './ServiceName'
import { Icon } from './Icon'

type Props = ConnectButtonProps

export const DeviceConnectMenu: React.FC<Props> = ({ onClick, ...props }) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()
  const { connections, device } = useContext(DeviceContext)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuWidth, setMenuWidth] = useState<number>()
  const connection = connections?.find(c => c.deviceID === device?.id && c.enabled)
  const css = useStyles(props)

  if (!device) return null

  const clickHandler = event => {
    event.stopPropagation()
    event.preventDefault()
    if (isPortal()) {
      setAnchorEl(event.currentTarget)
      setMenuWidth(event.currentTarget.offsetWidth)
    } else {
      allHandler()
    }
  }

  const closeHandler = () => {
    setAnchorEl(null)
  }

  const selectHandler = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, c: IConnection, serviceId: string) => {
    event.stopPropagation()
    event.preventDefault()
    closeHandler()
    history.push(`/devices/${device.id}/${serviceId}`)
    if (c.enabled) dispatch.connections.disconnect(c)
    else dispatch.connections.connect(c)
  }

  const allHandler = () => {
    closeHandler()
    dispatch.connections.set({
      queueCount: connections?.filter(c => c.enabled === !!connection?.enabled)?.length || 0,
      queueEnabling: !connection?.enabled,
      queueConnection: connection || newConnection(device.services[0]),
    })
    dispatch.connections.queueEnable({
      serviceIds: device.services.map(s => s.id),
      enabled: !connection?.enabled,
    })
  }

  const services = device.services
  return (
    <>
      <ConnectButton
        color="primary"
        size="icon"
        iconSize="xxs"
        iconType="solid"
        preventDefault
        onClick={clickHandler}
        className={css.button}
        connection={connection}
        permissions={device.permissions}
        all={!isPortal() && device.services.length > 1}
        {...props}
      />
      <Menu
        elevation={2}
        classes={{ paper: classnames(props.color === 'primary' && css.menu), list: css.subhead }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={closeHandler}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{ style: { minWidth: menuWidth } }}
        TransitionComponent={Fade}
        disableAutoFocusItem
      >
        {!!services.length && (
          <ListSubheader disableGutters>{connection?.enabled ? 'Stop' : 'Start'} a connection</ListSubheader>
        )}
        {services.map(service => {
          const c = connections?.find(c => c.id === service.id) || newConnection(service)
          return (
            <MenuItem
              dense
              key={service.id}
              color={service.state === 'active' ? 'primary' : 'grayDark'}
              onClick={event => selectHandler(event, c, service.id)}
              value={service.id}
              disabled={service.state === 'inactive'}
            >
              <ServiceName service={service} connection={c} />
            </MenuItem>
          )
        })}
        {!!services.length && <Divider />}
        <MenuItem dense color={connection?.enabled ? 'primary' : undefined} onClick={allHandler}>
          <ListItemIcon>
            <Icon name={connection?.enabled ? 'stop' : 'forward'} type="solid" color="primary" />
          </ListItemIcon>
          {connection?.enabled ? (isPortal() ? 'Disconnect all' : 'Stop all') : 'Connect all'} &nbsp;
        </MenuItem>
      </Menu>
    </>
  )
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  button: {
    marginLeft: spacing(2),
    marginRight: spacing(1),
  },
  subhead: {
    paddingTop: 4,
    '& .MuiListSubheader-root': {
      backgroundColor: palette.grayLightest.main,
    },
    '& .MuiListSubheader-root + .MuiDivider-root': {
      marginTop: 2,
    },
  },
  menu: {
    '& .MuiList-root': {
      backgroundColor: palette.primary.main,
    },
    '& .MuiListItem-root': {
      color: palette.alwaysWhite.main,
      fontWeight: '500',
      '&:hover': {
        backgroundColor: darken(palette.primary.main, 0.1),
      },
      '&:focus': {
        backgroundColor: darken(palette.primary.main, 0.1),
      },
      '&:focus:hover': {
        backgroundColor: darken(palette.primary.main, 0.15),
      },
    },
  },
}))
