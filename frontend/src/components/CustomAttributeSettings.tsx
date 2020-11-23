import React from 'react'
import { REGEX_NAME_SAFE } from '../shared/constants'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { newConnection, setConnection } from '../helpers/connectionHelper'
import { useApplicationService } from '../shared/applications'

type Props = { service: IService; connection?: IConnection }

export const CustomAttributeSettings: React.FC<Props> = ({ service, connection }) => {
  const app = useApplicationService('launch', service, connection)
  const disabled = service.state !== 'active'

  if (!connection) connection = newConnection(service)

  return (
    <>
      {app.customTokens.map(token => (
        <InlineTextFieldSetting
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
