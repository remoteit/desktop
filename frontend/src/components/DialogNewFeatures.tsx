import React from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core'

import { Icon } from '../components/Icon'
import { Route, useHistory } from 'react-router-dom'

export const DialogNewFeatures = () => {
  const history = useHistory()

  return (
    <Route path="/devices/welcome">
      <Dialog open style={{ zIndex: 2000 }} onClose={() => history.push('/devices')}>
        <DialogContent>
          <Typography variant="h1" gutterBottom>
            Welcome!
          </Typography>
          <Typography variant="body2">
            We're excited for you to try the fresh, more powerful experience taken from our desktop app, adapted for the
            web.
          </Typography>
          <List>
            <ListItem disableGutters>
              <ListItemIcon>
                <Icon name="exchange-alt" />
              </ListItemIcon>
              <ListItemText
                primary="Easier connection management"
                secondary="Manage all your recent and active connections all in one place."
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon>
                <Icon name="search" />
              </ListItemIcon>
              <ListItemText
                primary="Improve Search and Filter"
                secondary="Access your devices and services faster with our improved search and filter features."
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemIcon>
                <Icon name="smile" />
              </ListItemIcon>
              <ListItemText primary="Cleaner look and feel" secondary="Find things easily with our updated design." />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => history.push('/devices')} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Route>
  )
}
