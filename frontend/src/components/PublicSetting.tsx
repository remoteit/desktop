import React from 'react'
import { useTranslation } from 'react-i18next'
import { setConnection } from '../helpers/connectionHelper'
import { IP_OPEN, IP_LATCH } from '@common/constants'
import { SelectSetting } from './SelectSetting'

export const PublicSetting: React.FC<{ service: IService; connection?: IConnection }> = ({ service, connection }) => {
  const { t } = useTranslation()
  if (!connection || !connection.public || connection.connectLink) return null

  const disabled = connection.enabled || service.attributes.route === 'p2p'
  const helpMessage =
    connection.publicRestriction === IP_LATCH
      ? t(
          'publicSetting.latchHelp',
          'The connection will latch onto the first device to connect with IP restriction.'
        )
      : t('publicSetting.openHelp', 'Any device will be able to connect while the connection is active.')

  return (
    <SelectSetting
      icon={connection.publicRestriction === IP_LATCH ? 'lock' : 'unlock'}
      label={t('publicSetting.label', 'Security')}
      helpMessage={helpMessage}
      disabled={disabled || !connection.public}
      modified={connection.publicRestriction !== IP_LATCH}
      value={connection.publicRestriction || IP_LATCH}
      values={[
        { name: t('publicSetting.ipLatching', 'IP Latching'), key: IP_LATCH },
        { name: t('publicSetting.none', 'None'), key: IP_OPEN },
      ]}
      onChange={key => {
        connection &&
          setConnection({
            ...connection,
            publicRestriction: key.toString(),
          })
      }}
    />
  )
}
