import React, { useEffect, useState } from 'react'
import { makeStyles } from '@mui/styles'
import {
  Dialog,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Switch,
} from '@mui/material'
import { DeleteAccessKey } from './DeleteAccessKey'
import { CreateAccessKey } from './CreateAccessKey'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { dateOptions } from '../Duration/Duration'
import { Gutters } from '../Gutters'
import { Icon } from '../Icon'
import { spacing } from '../../styling'

export const AccountAccessKey: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false)
  const { accessKeys, secretKey, key, updating } = useSelector((state: ApplicationState) => state.keys)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    dispatch.keys.init()
  }, [])

  const handleToggle = k => {
    dispatch.keys.toggleAccessKeys({
      key: k.key,
      enabled: !k.enabled,
    })
  }

  return (
    <>
      <Typography variant="subtitle1">Authentication</Typography>
      <Gutters>
        <Typography variant="body2" gutterBottom>
          Access keys are used to authenticate you with our API. You can create a new key or delete an existing key at
          any time. You can also temporarily disable a key.
          <br />
          <em>If you lose or forget your secret key, you cannot retrieve it. There is a limit of 2 access keys.</em>
        </Typography>
        <Button
          variant="contained"
          color="primary"
          disabled={accessKeys.length > 1}
          onClick={() => {
            dispatch.keys.createAccessKey()
            setShowDialog(true)
          }}
        >
          Create Access key
        </Button>
      </Gutters>
      <List>
        {accessKeys?.map((k, index) => (
          <ListItem
            className={css.row}
            key={index}
            onClick={() => handleToggle(k)}
            disabled={updating === k.key}
            button
            dense
          >
            <ListItemText
              classes={{ primary: css.primary }}
              primary={k.key}
              secondary={
                <>
                  Created {k.created.toLocaleString(navigator.language, dateOptions)} &nbsp;/ &nbsp;
                  {k.lastUsed
                    ? 'Last used ' + k.lastUsed.toLocaleString(navigator.language, dateOptions)
                    : 'Never used'}
                </>
              }
            />
            <ListItemSecondaryAction>
              <DeleteAccessKey deleteKey={k} />
              {updating === k.key ? (
                <Icon name="spinner-third" spin inlineLeft />
              ) : (
                <Switch color="primary" onChange={() => handleToggle(k)} checked={k.enabled} />
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <Dialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false)
          dispatch.keys.set({ key: undefined, secretKey: undefined })
        }}
        fullWidth
      >
        <CreateAccessKey newKey={key} secretKey={secretKey} />
      </Dialog>
    </>
  )
}

const useStyles = makeStyles(theme => ({
  row: { '& .MuiListItemText-root': { marginLeft: spacing.md } },
  primary: { fontFamily: 'Roboto Mono', color: theme.palette.grayDarker.main, fontWeight: 300, letterSpacing: 0.5 },
}))
