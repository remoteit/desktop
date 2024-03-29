import React, { useEffect, useState } from 'react'
import { Button, List, Typography, Box } from '@mui/material'
import { DeleteAccessKey } from './DeleteAccessKey'
import { CreateAccessKey } from './CreateAccessKey'
import { useDispatch, useSelector } from 'react-redux'
import { State, Dispatch } from '../../store'
import { ListItemSetting } from '../ListItemSetting'
import { CopyCodeBlock } from '../CopyCodeBlock'
import { CodeBlock } from '../CodeBlock'
import { Timestamp } from '../Timestamp'
import { Gutters } from '../Gutters'
import { Notice } from '../Notice'
import { Icon } from '../Icon'

export const AccountAccessKey: React.FC = () => {
  const [showDialog, setShowDialog] = useState(false)
  const { accessKeys, secretKey, key, updating } = useSelector((state: State) => state.keys)
  const dispatch = useDispatch<Dispatch>()

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
        <Notice severity="warning" fullWidth gutterBottom>
          If you lose or forget your secret key, you cannot retrieve it.
          <em> There is a limit of 2 access keys. Keep your keys safe.</em>
        </Notice>
        <Typography variant="body2" gutterBottom>
          Access keys are necessary for authenticating with our API. You have the option to create a new key, delete an
          existing one, or temporarily disable a key. It's advisable to download and save your keys in the .remoteit
          directory of your home folder:
        </Typography>
        <CodeBlock>~/.remoteit/credentials</CodeBlock>
        <Box textAlign="right" marginBottom={4}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            disabled={accessKeys.length > 1}
            onClick={() => {
              dispatch.keys.createAccessKey()
              setShowDialog(true)
            }}
          >
            Generate Credentials
          </Button>
        </Box>
      </Gutters>
      <Gutters bottom={null}>
        <List>
          {accessKeys?.map((k, index) => (
            <Box marginBottom={4}>
              <CopyCodeBlock
                label="Public Key"
                value={k.key}
                hideCopyLabel
                sx={{ '& .MuiTypography-root': { opacity: k.enabled ? 1 : 0.5 } }}
              />
              <ListItemSetting
                hideIcon
                key={index}
                disabled={updating === k.key}
                toggle={k.enabled}
                onClick={() => handleToggle(k)}
                disableGutters
                secondaryContent={
                  updating === k.key ? (
                    <Icon name="spinner-third" color="gray" spin inlineLeft />
                  ) : k.enabled ? undefined : (
                    <DeleteAccessKey deleteKey={k} />
                  )
                }
                subLabel={
                  <>
                    Created <Timestamp date={k.created} variant="long" /> &nbsp;/ &nbsp;
                    {k.lastUsed ? (
                      <>
                        Last used <Timestamp date={k.lastUsed} variant="long" />
                      </>
                    ) : (
                      'Never used'
                    )}
                  </>
                }
              />
            </Box>
          ))}
        </List>
      </Gutters>
      <CreateAccessKey
        open={showDialog}
        onClose={() => {
          dispatch.keys.set({ key: undefined, secretKey: undefined })
          setShowDialog(false)
        }}
        newKey={key}
        secretKey={secretKey}
      />
    </>
  )
}
