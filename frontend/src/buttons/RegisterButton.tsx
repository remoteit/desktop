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
import { selectDevice } from '../models/devices'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
import { IconButton } from '../buttons/IconButton'
import { spacing } from '../styling'
import { Icon } from '../components/Icon'

const CLAIM_CODE_LENGTH = 8

export const RegisterButton: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const [el, setEl] = useState<Element | null>(null)
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const { claiming, hasDemo } = useSelector((state: ApplicationState) => ({
    claiming: state.ui.claiming,
    hasDemo: selectDevice(state, DEMO_DEVICE_ID) !== undefined,
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
          <ListItemLocation
            icon="hdd"
            pathname="/devices/setup"
            title="This device"
            onClick={handleClose}
            disableGutters
          />
          <ListItemLocation
            icon="raspberry-pi"
            iconType="brands"
            pathname="/devices/add/linux"
            title="Linux / Raspberry Pi"
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
            <ListItemText primary="remote.it demo device" secondary={hasDemo && 'Already shared'} />
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
  },
  form: {
    padding: spacing.xs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    '& button': { marginLeft: spacing.xs },
  },
})
