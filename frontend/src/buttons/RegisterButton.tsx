import React, { useState, useEffect } from 'react'
import {
  makeStyles,
  Tooltip,
  Typography,
  IconButton,
  Popover,
  List,
  ListItem,
  TextField,
  Button,
} from '@material-ui/core'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { spacing } from '../styling'
import { Body } from '../components/Body'
import { Icon } from '../components/Icon'

export const RegisterButton: React.FC = () => {
  const css = useStyles()
  const { devices, ui } = useDispatch<Dispatch>()
  const [el, setEl] = useState<HTMLButtonElement | null>(null)
  const [code, setCode] = useState<string>('')
  const { user, claiming } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
    claiming: state.ui.claiming,
  }))

  useEffect(() => {
    if (!claiming) handleClose()
  }, [claiming])

  if (!user?.email.includes('remote.it')) return null

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => setEl(event.currentTarget)
  const handleClose = () => {
    setEl(null)
    setCode('')
  }

  return (
    <>
      <Tooltip title="Device Registration">
        <IconButton onClick={handleOpen}>
          <Icon name="plus" size="sm" type="regular" />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!el}
        onClose={handleClose}
        anchorEl={el}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Body center className={css.popover}>
          <Typography variant="body1">Enter your registration code to claim a new device.</Typography>
          <form
            onSubmit={e => {
              e.preventDefault()
              ui.set({ claiming: true })
              devices.claimDevice(code)
            }}
          >
            <List>
              <ListItem>
                <TextField
                  autoFocus
                  size="small"
                  label="Registration Code"
                  value={code}
                  variant="filled"
                  onChange={event => setCode(event.target.value)}
                  fullWidth
                />
              </ListItem>
              <ListItem>
                <Button type="submit" variant="contained" color="primary" disabled={claiming} fullWidth>
                  {claiming ? 'Registering...' : 'Register'}
                </Button>
                <Button onClick={handleClose} fullWidth>
                  Cancel
                </Button>
              </ListItem>
            </List>
          </form>
        </Body>
      </Popover>
    </>
  )
}

const useStyles = makeStyles({
  popover: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    '& .MuiList-root, & form': { width: '100%' },
  },
})
