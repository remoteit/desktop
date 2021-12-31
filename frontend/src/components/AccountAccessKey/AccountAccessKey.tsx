import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Switch from '@material-ui/core/Switch'
import Typography from '@material-ui/core/Typography'
import { DeleteAccessKey } from './DeleteAccessKey'
import { CreateAccessKey } from './CreateAccessKey'
import Button from '@material-ui/core/Button'
import Collapse from '@material-ui/core/Collapse'
import { TextBlock } from '../TextBlock'
import { useDispatch, useSelector } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'

export function AccountAccessKey({ ...props }): JSX.Element {
  const classes = useStyles()
  const [maxlimit, setMaxLimit] = useState(0)
  const [showSection, setShowSection] = useState(false)

  const { keyArray, secretKey, key } = useSelector((state: ApplicationState) => ({
    keyArray: state.accounts.keyArray,
    secretKey: state.accounts.secretKey,
    key: state.accounts.key
  }))
  const { accounts } = useDispatch<Dispatch>()

  useEffect(() => {
    accounts.fetchAccessKeys()
  }, [])


  const handleToggle = (e) => {
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
      <List>
        <ListItem>
          <TextBlock>
            Access keys are used to authenticate you with our API. You can create a
            new key or delete an existing key at any time. You can also temporarily
            disable a key.
            <br />
            <em>
              If you lose or forget your secret key, you cannot retreive it. There
              is a limit of 2 access keys.
            </em>
          </TextBlock>
        </ListItem>
        <ListItem>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateKey}
            disabled={!(maxlimit < 2)}
            style={{ borderRadius: 3 }}
          >
            Create Access key
          </Button>
        </ListItem>
        {keyArray?.map((item, index) => {
          return (
            <div className={classes.root} key={index}>
              <List>
                <ListItem
                  key={item['key'] + index}
                  id={item['key']}
                  button
                  onClick={handleToggle}
                >
                  <ListItemText
                    primary={
                      <>
                        <Typography
                          component="span"
                          variant="body1"
                          color="textPrimary"
                        >
                          {item['key']}
                        </Typography>
                      </>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="caption"
                          color="textSecondary"
                        >
                          Created date {item['createdDate']} , {item['lastUsed']}
                        </Typography>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <ListItemIcon>
                      <DeleteAccessKey
                        deleteKey={item['key']}
                        enabled={item['enabled']}
                      />
                    </ListItemIcon>
                    <Switch
                      id={item['key']}
                      edge="end"
                      color="primary"
                      onChange={handleToggle}
                      checked={item['enabled']}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
              {index === 0 ? (
                <Collapse in={showSection}>
                  <CreateAccessKey
                    maxlimit={maxlimit}
                    secretKey={secretKey}
                    showSection={showSection}
                    accessKey={key}
                    closePanel={closePanel}
                  />
                </Collapse>
              ) : (
                <></>
              )}
            </div>
          )
        })}
      </List>



    </>
  )
}

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    maxWidth: 550,
    backgroundColor: theme.palette.background.paper,
  },
}))