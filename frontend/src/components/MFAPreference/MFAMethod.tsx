import React from 'react'
import { List } from '@material-ui/core'
import { Quote } from '../Quote'
import { ListItemCopy } from '../ListItemCopy'
import { useTranslation } from 'react-i18next'

type Props = {
  method?: any
  phoneNumber?: string
  verified?: boolean
  backupCode?: string
  turnOff: () => void
}

export const MFAMethod: React.FC<Props> = ({ method, phoneNumber, verified, backupCode, turnOff }) => {

  const { t } = useTranslation()
  return (
    <>
      {/* Authenticator Enabled */}
      {method === 'SOFTWARE_TOKEN_MFA' && (
        <div>
          <p>
            {'Two-factor configured with'}
            <b style={{ color: '#81c606' }}>{' ON '}</b>
            <b>{' (Authenticator App)'}</b>
          </p>
        </div>
      )}

      {/* SMS Enabled */}
      {method === 'SMS_MFA' && (
        <div>
          <p>
            {'Two-factor configured with'}
            <b style={{ color: '#81c606' }}>{' ON '}</b>
            <b>{'(SMS)'}</b>
          </p>
          {verified && (
            <p>
              {phoneNumber}
              <span style={{ color: '#81c606' }}>{' Verified '}</span>
            </p>
          )}
        </div>
      )}

      {(method === 'SMS_MFA' || method === 'SOFTWARE_TOKEN_MFA') && (
        <>
          <List>
            <Quote margin={10} noInset={true}>
              <ListItemCopy
                label={t('pages.auth-mfa.recovery-code-title').toUpperCase()}
                value={backupCode}
              />
            </Quote>
          </List>
          {turnOff()}
        </>
      )}
    </>
  )
}
