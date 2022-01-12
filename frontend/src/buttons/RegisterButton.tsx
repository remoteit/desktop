import React, { useState, useEffect } from 'react'
import { makeStyles, Popover, ListItem, ListSubheader, TextField, Divider } from '@material-ui/core'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { ListItemLocation } from '../components/ListItemLocation'
// import { spacing } from '../styling'
// import { Body } from '../components/Body'
import { IconButton } from '../buttons/IconButton'

const CLAIM_CODE_LENGTH = 8

export const RegisterButton: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const [el, setEl] = useState<Element | null>(null)
  const [code, setCode] = useState<string>('')
  const [valid, setValid] = useState<boolean>(false)
  const { claiming } = useSelector((state: ApplicationState) => state.ui)

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
        title="Device Registration"
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
        // getContentAnchorEl={null}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <ListSubheader>Add a device</ListSubheader>
        <ListItemLocation icon="hdd" pathname="/devices/setup" title="This device" onClick={handleClose} dense />
        <ListItemLocation
          icon="raspberry-pi"
          iconType="brands"
          pathname="/devices/setup"
          title="Linux / Raspberry Pi"
          onClick={handleClose}
          dense
        />
        <ListItemLocation icon="vial" pathname="/devices/setup" title="Demo device" onClick={handleClose} dense />
        &nbsp;
        <Divider />
        <ListSubheader>Or register a device</ListSubheader>
        {/*
         <ListItem>
            <Typography variant="caption">Or enter a claim code</Typography>
          </ListItem> */}
        <form
          onSubmit={e => {
            e.preventDefault()
            devices.claimDevice(code)
          }}
        >
          <ListItem>
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
              inline
              submit
              title="Claim"
              icon="check"
              size="base"
              color={claiming || !valid ? 'gray' : 'success'}
              loading={claiming}
              disabled={claiming || !valid}
            />
          </ListItem>
        </form>
      </Popover>
    </>
  )
}

const useStyles = makeStyles({
  form: {
    display: 'flex',
    // paddingTop: spacing.md,
    // paddingBottom: spacing.sm,
    // '& .MuiList-root, & form': { width: '100%' },
    // '& .MuiListItem-root': { margin: 0, width: '100%' },
  },
})
