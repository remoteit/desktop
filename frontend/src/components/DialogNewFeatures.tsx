import React from 'react'
import { Button, Dialog, DialogActions, DialogTitle, ListItem, ListItemIcon, ListItemText, makeStyles } from '@material-ui/core'
import { fontSize } from '@remote.it/components/lib/styles/variables'
import { Icon } from '../components/Icon'
import { Route, useHistory } from 'react-router-dom'

export const DialogNewFeatures = () => {
  const history = useHistory()
  const css = useStyles({})
  return (
    <Route path="/devices/welcome">
      <div>
        <Dialog
          open={true}
          onClose={() => history.push('/devices')}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {'Welcome to remote.it experience!'}
            <div style={{ fontSize: fontSize.md, fontWeight: 400 }}>
              {"We're excited for you to try a fresh, simpler experience of remote.it"}
            </div>
          </DialogTitle>
          <ListItem alignItems="flex-start" className={css.item}>
            <ListItemIcon>
              <Icon name="exchange-alt" />
            </ListItemIcon>
            <ListItemText
              primary="Easier connection management"
              secondary="Manage all your recent and active connections all in one place."
            />
          </ListItem>
          <ListItem alignItems="flex-start" className={css.item}>
            <ListItemIcon>
              <Icon name="search" />
            </ListItemIcon>
            <ListItemText
              primary="Improve Search and Filter"
              secondary="Access your devices and services faster with our improved search and filter features."
            />
          </ListItem>
          <ListItem alignItems="flex-start" className={css.item}>
            <ListItemIcon>
              <Icon name="smile" />
            </ListItemIcon>
            <ListItemText primary="Cleaner look and feel" secondary="Find things easily with our updated design." />
          </ListItem>
          <DialogActions style={{ justifyContent: 'flex-start' }}>
            <Button variant="outlined" onClick={() => history.push('/devices')} color="primary" style={{ borderRadius: 3 }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Route>
  )
}

const useStyles =
  makeStyles({
    item: {
      marginBottom: 0,
      paddingBottom: 0
    }
  })
