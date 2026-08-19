import React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { setConnection } from '../../helpers/connectionHelper'
import { InlineTextFieldSetting } from '../InlineTextFieldSetting'
import { State } from '../../store'
import { REGEX_PORT_SAFE } from '../../constants'

export const PortSetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const { t } = useTranslation()
  const freePort = useSelector((state: State) => state.backend.freePort)

  if (!service) return null

  const save = (port?: number) =>
    connection &&
    setConnection({
      ...connection,
      port: port || connection.port,
    })

  return (
    <InlineTextFieldSetting
      icon="port"
      value={connection.port || freePort}
      label={t('portSetting.localPort', 'Local Port')}
      disabled={connection.connected || connection.public}
      filter={REGEX_PORT_SAFE}
      resetValue={freePort}
      onSave={port => save(+port)}
    />
  )
}
