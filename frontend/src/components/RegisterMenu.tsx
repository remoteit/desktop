import React, { useState, useEffect } from 'react'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../shared/constants'
import {
  makeStyles,
  Popover,
  List,
  ListItem,
  ListSubheader,
  ListItemIcon,
  ListItemText,
  TextField,
  Divider,
} from '@material-ui/core'
import { selectDeviceByAccount } from '../models/devices'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { ListItemLocation } from './ListItemLocation'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'

const CLAIM_CODE_LENGTH = 8

export const RegisterMenu: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const [el, setEl] = useState<Element | null>(null)
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const { claiming, hasDemo, hasThisDevice } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDeviceByAccount(state, DEMO_DEVICE_ID, state.auth.user?.id) !== undefined,
    hasThisDevice: !!state.backend.device.uid,
  }))

  const handleClose = () => {
    setEl(null)
    setValid(false)
    setCode('')
  }

  useEffect(() => {
    if (!claiming) handleClose()
  }, [claiming])

  const handleOpen = (event: React.MouseEvent) => {
    setEl(event.currentTarget)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let { value } = event.target
    if (value.length >= CLAIM_CODE_LENGTH) {
      value = value.substring(0, CLAIM_CODE_LENGTH)
      setValid(true)
    } else {
      setValid(false)
    }
    setCode(value.toUpperCase())
  }

  return (
    <>
      <IconButton
        title="Add device"
        variant="contained"
        onClick={handleOpen}
        color="primary"
        icon="plus"
        size="sm"
        type="regular"
        fixedWidth
      />
      <Popover
        open={!!el}
        onClose={handleClose}
        anchorEl={el}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <List className={css.list} disablePadding dense>
          <ListSubheader>Add a device</ListSubheader>
          <ListItem
            button
            disableGutters
            disabled={hasThisDevice}
            onClick={handleClose}
            to="/devices/setup"
            component={Link}
          >
            <ListItemIcon>
              <Icon name="laptop" size="sm" fixedWidth />
            </ListItemIcon>
            <ListItemText primary="This system" secondary={hasThisDevice && 'Already created'} />
          </ListItem>
          <ListItemLocation
            icon="raspberry-pi"
            iconType="brands"
            pathname="/devices/add/linux"
            title="Linux & Raspberry Pi"
            subtitle="Including Jetson and OpenWRT"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            icon="windows"
            iconType="brands"
            pathname="/devices/add/windows"
            title="Windows"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            icon="apple"
            iconType="brands"
            pathname="/devices/add/apple"
            title="Mac"
            onClick={handleClose}
            disableGutters
          />
          <ListItem
            button
            disableGutters
            disabled={hasDemo || claiming}
            onClick={() => {
              setCode(DEMO_DEVICE_CLAIM_CODE)
              devices.claimDevice(DEMO_DEVICE_CLAIM_CODE)
            }}
          >
            <ListItemIcon>
              <Icon name="aws" size="md" type="brands" fixedWidth />
            </ListItemIcon>
            <ListItemText primary="Demo device" secondary={hasDemo && 'Already shared'} />
          </ListItem>
        </List>
        <Divider />
        <form
          onSubmit={e => {
            e.preventDefault()
            devices.claimDevice(code)
          }}
        >
          <List className={css.form}>
            <ListItem disableGutters>
              <TextField
                autoFocus
                label="Claim Code"
                value={code}
                variant="filled"
                disabled={claiming}
                onChange={handleChange}
                fullWidth
              />
              <IconButton
                submit
                title="Claim"
                icon="check"
                size="base"
                color={claiming || !valid ? 'grayDark' : 'success'}
                loading={claiming}
                disabled={claiming || !valid}
              />
            </ListItem>
          </List>
        </form>
      </Popover>
    </>
  )
}

const useStyles = makeStyles({
  list: {
    padding: spacing.xs,
    '& .MuiListItem-root': { paddingRight: spacing.md },
  },
  form: {
    padding: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    '& button': { marginLeft: spacing.xs },
  },
})
