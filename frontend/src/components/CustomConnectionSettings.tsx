import React from 'react'
import { isPortal } from '../services/Browser'
import { Application } from '../shared/applications'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { newConnection, setConnection } from '../helpers/connectionHelper'

type Props = {
  app: Application
  service: IService
  connection?: IConnection
  disabled?: boolean
}

export const CustomConnectionSettings: React.FC<Props> = ({ app, service, connection, disabled }) => {
  if (!connection) connection = newConnection(service)

  return (
    <>
      {app.customTokens.map(token =>
        (token === 'path' || token === 'app') && !isPortal() ? (
          <InlineFileFieldSetting
            key={token}
            type={token}
            label="Application Path"
            value={app.value(token)}
            disabled={disabled}
            onSave={value => {
              if (!connection) return
              if (value) {
                setConnection({ ...connection, [token]: value })
              } else {
                let props = { ...connection }
                delete props[token]
                setConnection(props)
              }
            }}
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
            onSave={value =>
              connection &&
              setConnection({
                ...connection,
                [token]: value.toString(),
              })
            }
          />
        )
      )}
    </>
  )
}
