import React, { useState } from 'react'
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
  const [el, setEl] = useState<HTMLButtonElement | null>(null)
  const { user } = useSelector((state: ApplicationState) => ({
    user: state.auth.user,
  }))

  if (!user?.email.includes('remote.it')) return null

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => setEl(event.currentTarget)
  const handleClose = () => setEl(null)

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
          <List>
            <ListItem>
              <TextField
                size="small"
                label="Service Port"
                variant="filled"
                onChange={() => {} /* event => setForm({ ...form, port: +event.target.value }) */}
                fullWidth
              />
            </ListItem>
            <ListItem>
              <Button type="submit" variant="contained" color="primary" fullWidth disabled={false /* !!error */}>
                Register
              </Button>
            </ListItem>
            <ListItem>
              <Button onClick={() => {} /* onCancel */} fullWidth>
                Cancel
              </Button>
            </ListItem>
          </List>
        </Body>
      </Popover>
    </>
  )
}

const useStyles = makeStyles({
  popover: {
    padding: spacing.xl,
    '& .MuiList-root': { width: '100%' },
  },
})
