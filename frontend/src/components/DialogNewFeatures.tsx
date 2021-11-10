import React from 'react'
import { Button, Dialog, DialogActions, DialogTitle, ListItem, ListItemIcon, ListItemText, makeStyles } from '@material-ui/core'
import { fontSize } from '@remote.it/components/lib/styles/variables'
import { Icon } from '../components/Icon'

type Props = { open: boolean; onClose: () => void }

export const DialogNewFeatures: React.FC<Props> = ({ open, onClose }) => {

  const css = useStyles({})
  return (
    <div>
      <Dialog
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {'Welcome to remote.it experience!'}
          <div className={css.subtitle}>
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
          <Button variant="outlined" onClick={onClose} color="primary" style={{ borderRadius: 3 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

const useStyles =
  makeStyles({
    item: {
      marginBottom: 0,
      paddingBottom: 0
    },
    subtitle: {
      fontSize: fontSize.md,
      fontWeight: 400
    }
  })
