import React, { useState, useEffect } from 'react'
import { makeStyles } from '@mui/styles'
import { safeHostname } from '../shared/nameHelper'
import { DEMO_DEVICE_CLAIM_CODE, DEMO_DEVICE_ID } from '../shared/constants'
import {
  Popover,
  List,
  ListItem,
  ListSubheader,
  ListItemIcon,
  ListItemText,
  Typography,
  TextField,
  Divider,
} from '@mui/material'
import { selectDeviceByAccount } from '../models/devices'
import { isPortal, getOs } from '../services/Browser'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { selectPermissions } from '../models/organization'
import { ListItemLocation } from './ListItemLocation'
import { IconButton } from '../buttons/IconButton'
import { DesktopUI } from './DesktopUI'
import { GuideBubble } from './GuideBubble'
import { platforms } from '../platforms'
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
  const { claiming, hasDemo, hasThisDevice, permissions, hostname } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDeviceByAccount(state, DEMO_DEVICE_ID, state.user.id) !== undefined,
    hasThisDevice: !!state.backend.thisId,
    permissions: selectPermissions(state),
    hostname: safeHostname(state.backend.environment.hostname, []),
  }))

  const disabled = !permissions?.includes('MANAGE')

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
  if (isPortal()) thisLink = `/add/${getOs()}`

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
        type="solid"
        fixedWidth
      />
      <Popover
        open={!!el}
        onClose={handleClose}
        anchorEl={el}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <DesktopUI>
          <List className={css.list} disablePadding dense>
            <ListSubheader disableGutters>Add this system</ListSubheader>
            <GuideBubble
              enterDelay={400}
              guide="registerMenu"
              placement="right"
              startDate={new Date('1122-09-15')}
              instructions={
                <>
                  <Typography variant="h3" gutterBottom>
                    <b>Select a device</b>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    You can setup the device you are currently using, or follow the simple instructions to setup one of
                    the commonly used platforms.
                  </Typography>
                </>
              }
            >
              <ListItem button disableGutters onClick={handleClose} to={thisLink} component={Link}>
                <ListItemIcon>
                  <Icon name={getOs()} fixedWidth platformIcon />
                </ListItemIcon>
                <ListItemText primary={hostname} secondary={hasThisDevice && 'Already created'} />
              </ListItem>
            </GuideBubble>
          </List>
          <Divider />
        </DesktopUI>
        <List className={css.list} disablePadding dense>
          <ListSubheader disableGutters>Add a device</ListSubheader>
          {[
            'aws',
            'azure',
            'gcp',
            'raspberrypi',
            'linux',
            'docker',
            'arm',
            'firewalla',
            'nas',
            'tinkerboard',
            'windows',
            'mac',
          ].map(p => {
            const platform = platforms.get(p)
            return (
              <ListItemLocation
                iconPlatform
                key={p}
                icon={platform.id}
                pathname={`/add/${platform.id}`}
                title={platform.name}
                subtitle={platform.subtitle}
                onClick={handleClose}
                disableGutters
              />
            )
          })}
          <ListItem
            button
            disableGutters
            disabled={hasDemo || claiming}
            onClick={() => {
              setCode(DEMO_DEVICE_CLAIM_CODE)
              devices.claimDevice({ code: DEMO_DEVICE_CLAIM_CODE })
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
            devices.claimDevice({ code })
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
