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
import { isPortal, getOs } from '../services/Browser'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { selectPermissions } from '../models/organization'
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
  const { claiming, hasDemo, hasThisDevice, permissions } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDeviceByAccount(state, DEMO_DEVICE_ID, state.user.id) !== undefined,
    hasThisDevice: !!state.backend.thisId,
    permissions: selectPermissions(state),
  }))

  const disabled = !permissions?.includes('REGISTER')

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

  let thisLink = '/devices/setup'
  if (isPortal()) thisLink = `/add/${getOs().replace('mac', 'apple')}`

  return (
    <>
      <IconButton
        title={
          disabled ? (
            <>
              Register permission required to <br />
              add a device to this organization.
            </>
          ) : (
            'Add device'
          )
        }
        forceTitle
        hideDisableFade
        variant="contained"
        disabled={disabled}
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
          <ListSubheader disableGutters>Add a device</ListSubheader>
          <ListItem button disableGutters disabled={hasThisDevice} onClick={handleClose} to={thisLink} component={Link}>
            <ListItemIcon>
              <Icon name="this" fixedWidth platformIcon />
            </ListItemIcon>
            <ListItemText primary="This system" secondary={hasThisDevice && 'Already created'} />
          </ListItem>
          <ListItemLocation
            iconPlatform
            icon="aws"
            pathname="/add/aws"
            title="AWS"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            iconPlatform
            icon="gcp"
            pathname="/add/gcp"
            title="Google Cloud"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            iconPlatform
            icon="azure"
            pathname="/add/azure"
            title="Microsoft Azure"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            iconPlatform
            icon="raspberrypi"
            pathname="/add/raspberrypi"
            title="Linux & Raspberry Pi"
            subtitle="Including Jetson and OpenWRT"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            iconPlatform
            icon="nas"
            pathname="/add/nas"
            title="Synology"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            iconPlatform
            icon="windows"
            pathname="/add/windows"
            title="Windows"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            iconPlatform
            icon="apple"
            pathname="/add/apple"
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
              <Icon name="remoteit" size="md" platformIcon fixedWidth />
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
