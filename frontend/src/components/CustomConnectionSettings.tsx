import React from 'react'
import { isPortal } from '../services/Browser'
import { Application } from '../shared/applications'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { newConnection, setConnection, updateImmutableData, isFileToken } from '../helpers/connectionHelper'

type Props = {
  app: Application
  service: IService
  connection?: IConnection
  disabled?: boolean
}

export const CustomConnectionSettings: React.FC<Props> = ({
  app,
  service,
  connection = newConnection(service),
  disabled,
}) => {
  const update = (token: string, value?: string) => {
    let updated = { ...connection, [token]: value }
    if (!value) delete updated[token]
    app.connection = updated
    updated = updateImmutableData(updated, app)
    setConnection(updated)
  }

  return (
    <>
      {app.customTokens.map(token =>
        isFileToken(token) && !isPortal() ? (
          <InlineFileFieldSetting
            key={token}
            token={token}
            label={token === 'app' ? 'Application Path' : token}
            value={app.value(token)}
            disabled={disabled}
            onSave={value => update(token, value)}
          />
        ) : (
          <InlineTextFieldSetting
            hideIcon
            key={token}
            label={token}
            value={app.value(token)}
            disabled={disabled}
            type={token === 'password' ? token : undefined}
            // filter={REGEX_NAME_SAFE} // should be set by application type
            onSave={value => connection && update(token, value.toString())}
          />
        )
      )}
    </>
  )
}
