import React from 'react'
import { List } from '@mui/material'
import { ListItemCopy } from '../ListItemCopy'
import { Box, Button, Typography } from '@mui/material'
import { ColorChip } from '../ColorChip'
import { IMfa } from '../../models/mfa'
import { spacing } from '../../styling'

const chipSx = {
  marginTop: `${spacing.lg}px`,
  marginBottom: `${spacing.sm}px`,
  display: 'flex',
  alignItems: 'center',
  '& > *': { marginRight: `${spacing.md}px` },
} as const

type Props = {
  method?: IMfa['mfaMethod']
  phoneNumber: string
  verified?: boolean
  backupCode?: string
  loading?: boolean
  onClick: () => void
}

export const MFAMethod: React.FC<Props> = ({ method, phoneNumber, verified, backupCode, loading, onClick }) => {
  return (
    <>
      {/* Authenticator Enabled */}
      {method === 'SOFTWARE_TOKEN_MFA' && (
        <Box sx={chipSx}>
          <ColorChip label="ON / Authenticator App" variant="contained" color="success" />
        </Box>
      )}

      {/* SMS Enabled */}
      {method === 'SMS_MFA' && (
        <Box sx={chipSx}>
          <ColorChip label="ON / SMS" variant="contained" color="success" />
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

