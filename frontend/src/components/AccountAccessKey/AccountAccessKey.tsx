import React, { useEffect, useState } from 'react'
import {
  makeStyles,
  Dialog,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Switch,
} from '@material-ui/core'
import { DeleteAccessKey } from './DeleteAccessKey'
import { CreateAccessKey } from './CreateAccessKey'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Gutters } from '../Gutters'
import { spacing } from '../../styling'

export const AccountAccessKey: React.FC = () => {
  const [showSection, setShowSection] = useState(false)
  const { keyArray, secretKey, key } = useSelector((state: ApplicationState) => ({
    keyArray: state.accounts.keyArray,
    secretKey: state.accounts.secretKey,
    key: state.accounts.key,
  }))
  const { accounts } = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    accounts.fetchAccessKeys()
  }, [])

  const handleToggle = e => {
    const selectedId = e.currentTarget.id
    const selectedKey = keyArray?.filter(item => selectedId === item['key'])
    if (selectedKey?.length) {
      const properties = {
        key: selectedKey[0]['key'],
        enabled: !selectedKey[0]['enabled'],
      }
      accounts.toggleAccessKeys(properties)
    }
  }

  const handleCreateKey = () => {
    accounts.createAccessKey()
    setShowSection(true)
  }

  function closePanel() {
    setShowSection(false)
  }

  return (
    <>
      <Typography variant="subtitle1">Access key</Typography>
      <Gutters>
        <Typography variant="body2" gutterBottom>
          Access keys are used to authenticate you with our API. You can create a new key or delete an existing key at
          any time. You can also temporarily disable a key.
          <br />
          <em>If you lose or forget your secret key, you cannot retrieve it. There is a limit of 2 access keys.</em>
        </Typography>
        <Button variant="contained" color="primary" onClick={handleCreateKey}>
          Create Access key
        </Button>
      </Gutters>
      <List>
        {keyArray?.map((item, index) => (
          <ListItem className={css.row} key={index} id={item['key']} onClick={handleToggle} button dense>
            <ListItemText primary={item['key']} secondary={`Created ${item['createdDate']}, ${item['lastUsed']}`} />
            <ListItemSecondaryAction>
              <ListItemIcon>
                <DeleteAccessKey deleteKey={item['key']} enabled={item['enabled']} />
              </ListItemIcon>
              <Switch id={item['key']} edge="end" color="primary" onChange={handleToggle} checked={item['enabled']} />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Dialog open={showSection} onClose={closePanel} fullWidth>
        <CreateAccessKey key={key} secretKey={secretKey} />
      </Dialog>
    </>
  )
}

const useStyles = makeStyles(theme => ({
  row: {
    '& .MuiListItemText-root': { marginLeft: spacing.md },
    '& .MuiListItemText-primary': { fontFamily: 'Roboto Mono', fontWeight: 100, color: theme.palette.grayDark },
  },
}))
