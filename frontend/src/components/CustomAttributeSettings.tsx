import React from 'react'
import { isPortal } from '../services/Browser'
import { Application } from '../shared/applications'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { InlineFileFieldSetting } from './InlineFileFieldSetting'
import { newConnection, setConnection } from '../helpers/connectionHelper'

type Props = { app: Application; service: IService; connection?: IConnection }

export const CustomAttributeSettings: React.FC<Props> = ({ app, service, connection }) => {
  if (!connection) connection = newConnection(service)

  return (
    <>
      {app.customTokens.map(token =>
        token === 'path' && !isPortal() ? (
          <InlineFileFieldSetting
            key={token}
            label="Application Path"
            value={app.value(token)}
            onSave={value => {
              if (!connection) return
              if (value) {
                setConnection({ ...connection, path: value })
              } else {
                const { path, ...props } = connection
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
