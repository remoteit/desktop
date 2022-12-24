import React from 'react'
import { setConnection } from '../helpers/connectionHelper'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { REGEX_CONNECTION_NAME, MAX_CONNECTION_NAME_LENGTH } from '../shared/constants'

export const SubdomainSetting: React.FC<{ service: IService; instance?: IInstance; connection: IConnection }> = ({
  service,
  connection,
}) => {
  const resetValue = service.subdomain
  return (
    <InlineTextFieldSetting
      required
      modified={connection.name !== resetValue}
      icon="i-cursor"
      value={connection.name}
      label="Subdomain"
      resetValue={resetValue}
      disabled={connection.connected || connection.public}
      filter={REGEX_CONNECTION_NAME}
      maxLength={MAX_CONNECTION_NAME_LENGTH}
      onSave={name =>
        setConnection({
          ...connection,
          name: name.toString() || connection.name,
        })
      }
    />
  )
}
