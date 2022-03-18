import React from 'react'
import { List } from '@material-ui/core'
import { Quote } from '../Quote'
import { ListItemCopy } from '../ListItemCopy'
import { IMfa } from '../../models/mfa'

type Props = {
  method?: IMfa['mfaMethod']
  phoneNumber: string
  verified?: boolean
  backupCode?: string
  turnOff: () => void
}

export const MFAMethod: React.FC<Props> = ({ method, phoneNumber, verified, backupCode, turnOff }) => {
  return (
    <>
      {/* Authenticator Enabled */}
      {method === 'SOFTWARE_TOKEN_MFA' && (
        <div>
          <p>
            Two-factor configured with
            <b style={{ color: '#81c606' }}> ON </b>
            <b> (Authenticator App)</b>
          </p>
        </div>
      )}

      {/* SMS Enabled */}
      {method === 'SMS_MFA' && (
        <div>
          <p>
            Two-factor configured with
            <b style={{ color: '#81c606' }}> ON </b>
            <b>(SMS)</b>
          </p>
          {verified && (
            <p>
              {phoneNumber}
              <span style={{ color: '#81c606' }}> Verified </span>
            </p>
          )}
        </div>
      )}

      {(method === 'SMS_MFA' || method === 'SOFTWARE_TOKEN_MFA') && (
        <>
          <List>
            <Quote margin={10} paddingLeft={40}>
              <ListItemCopy label="RECOVERY CODE" value={backupCode} />
            </Quote>
          </List>
          {turnOff()}
        </>
      )}
    </>
  )
}
