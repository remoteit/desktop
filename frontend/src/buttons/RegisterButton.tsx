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

const CLAIM_CODE_LENGTH = 8

export const RegisterButton: React.FC = () => {
  const css = useStyles()
  const { devices } = useDispatch<Dispatch>()
  const [el, setEl] = useState<HTMLButtonElement | null>(null)
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

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
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
      <Tooltip title="Device Registration">
        <IconButton onClick={handleOpen}>
          <Icon name="plus" size="sm" type="regular" fixedWidth />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!el}
        onClose={handleClose}
        anchorEl={el}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Body center className={css.popover}>
          <Typography variant="caption">Enter your code to register a new device.</Typography>
          <form
            onSubmit={e => {
              e.preventDefault()
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
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    endAdornment: claiming ? (
                      <Icon name="spinner-third" size="sm" spin type="regular" />
                    ) : (
                      valid && <Icon name="check" color="primary" size="sm" type="regular" />
                    ),
                  }}
                />
              </ListItem>
              <ListItem>
                <Button type="submit" variant="contained" color="primary" disabled={claiming || !valid} fullWidth>
                  {claiming ? 'Working' : 'Register'}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    '& .MuiList-root, & form': { width: '100%' },
    '& .MuiListItem-root': { margin: 0, width: '100%' },
  },
})
