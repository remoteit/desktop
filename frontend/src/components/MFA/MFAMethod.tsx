import React from 'react'
import { List } from '@material-ui/core'
import { ListItemCopy } from '../ListItemCopy'
import { makeStyles, Box, Button, Typography, Chip } from '@material-ui/core'
import { IMfa } from '../../models/mfa'
import { spacing } from '../../styling'

type Props = {
  method?: IMfa['mfaMethod']
  phoneNumber: string
  verified?: boolean
  backupCode?: string
  loading?: boolean
  onClick: () => void
}

export const MFAMethod: React.FC<Props> = ({ method, phoneNumber, verified, backupCode, loading, onClick }) => {
  const css = useStyles()
  return (
    <>
      {/* Authenticator Enabled */}
      {method === 'SOFTWARE_TOKEN_MFA' && (
        <Box className={css.chip}>
          <Chip label="ON / Authenticator App" color="secondary" />
        </Box>
      )}

      {/* SMS Enabled */}
      {method === 'SMS_MFA' && (
        <Box className={css.chip}>
          <Chip label="ON / SMS" color="secondary" />
          {verified && (
            <>
              <Typography variant="body2">{phoneNumber}</Typography>
              <Typography variant="body2" color="secondary">
                Verified
              </Typography>
            </>
          )}
        </Box>
      )}

      {(method === 'SMS_MFA' || method === 'SOFTWARE_TOKEN_MFA') && (
        <>
          <List>
            <ListItemCopy label="Recovery code" value={backupCode} showBackground />
          </List>
          <Typography variant="caption" component="div" gutterBottom>
            The recovery code is used to access your account in the event you cannot receive two-factor authentication
            codes. <br />
            Treat your recovery code with the same level of attention as you would your password.
          </Typography>
          <Button disabled={loading} onClick={onClick} variant="outlined" color="primary" size="small">
            Turn off
          </Button>
        </>
      )}
    </>
  )
}

const useStyles = makeStyles(theme => ({
  chip: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    display: 'flex',
    alignItems: 'center',
    '& > *': { marginRight: spacing.md },
    '& .MuiChip-root': { color: theme.palette.alwaysWhite.main, fontWeight: 'bold' },
  },
}))
