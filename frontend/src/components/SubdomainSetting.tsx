import React from 'react'
import { useTranslation } from 'react-i18next'
import { setConnection } from '../helpers/connectionHelper'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { MAX_CONNECTION_NAME_LENGTH } from '../constants'

export const SubdomainSetting: React.FC<{ service: IService; instance?: IInstance; connection: IConnection }> = ({
  service,
  connection,
}) => {
  const { t } = useTranslation()
  const resetValue = service.subdomain
  return (
    <InlineTextFieldSetting
      required
      modified={connection.name !== resetValue}
      icon="host"
      value={connection.name}
      label={t('subdomainSetting.subdomain', 'Subdomain')}
      resetValue={resetValue}
      disabled={connection.public}
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
