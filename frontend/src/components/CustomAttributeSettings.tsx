import React from 'react'
import { REGEX_NAME_SAFE } from '../shared/constants'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { useApplication } from '../hooks/useApplication'

type Props = { service: IService; connection?: IConnection }

export const CustomAttributeSettings: React.FC<Props> = ({ service, connection }) => {
  const app = useApplication('launch', service, connection)
  const disabled = service.state !== 'active'

  if (!connection) connection = newConnection(service)

  return (
    <>
      {app.customTokens.map(token => (
        <InlineTextFieldSetting
          hideIcon
          key={token}
          label={token}
          value={app.value(token)}
          disabled={disabled}
          filter={REGEX_NAME_SAFE}
          onSave={value =>
            connection &&
            setConnection({
              ...connection,
              [token]: value.toString(),
            })
          }
        />
      ))}
    </>
  )
}
