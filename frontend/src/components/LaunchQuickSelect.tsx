import React from 'react'
import { Dispatch } from '../store'
import { Application } from '@common/applications'
import { Menu, MenuItem, Button, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { setConnection } from '../helpers/connectionHelper'
import { useDispatch } from 'react-redux'
import { IconButton } from '../buttons/IconButton'
import { Icon } from './Icon'

type Props = {
  app: Application
  disabled?: boolean
}

export const LaunchQuickSelect: React.FC<Props> = ({ app, disabled }) => {
  const dispatch = useDispatch<Dispatch>()
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const handleClick = event => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleSelect = launchType => {
    app.connection && setConnection({ ...app.connection, launchType })
    setAnchorEl(null)
  }

  return (
    <>
      <Button
        size="small"
        onClick={handleClick}
        variant="contained"
        disabled={disabled}
        sx={{ display: 'block', py: 0.5, mx: -1.5 }}
      >
        <Typography variant="h5">
          Launch
          <Icon name="chevron-down" type="solid" size="xs" inline />
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        disableScrollLock
        autoFocus={false}
        elevation={2}
      >
        {/* <MenuItem dense onClick={() => handleSelect('NONE')} selected={app.launchType === 'NONE'}>
          <ListItemIcon>
            <Icon name="ban" size="md" />
          </ListItemIcon>
          <ListItemText primary="None" />
        </MenuItem> */}
        {app.launchMethods.map(method => (
          <MenuItem
            dense
            key={method.type}
            selected={app.launchType === method.type}
            onClick={() => handleSelect(method.type)}
          >
            <ListItemIcon>
              <Icon name={method.icon} size="md" />
            </ListItemIcon>
            <ListItemText primary={method.name} />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
