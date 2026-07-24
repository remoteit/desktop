import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { ListItemSetting } from '../ListItemSetting'

export const SharedAccessSetting: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { t } = useTranslation()
  const { devices } = useDispatch<Dispatch>()

  if (!device || device.shared) return null

  return (
    <ListItemSetting
      label={t('sharedAccessSetting.label', 'Disable shared access')}
      subLabel={t(
        'sharedAccessSetting.subLabel',
        'While active, no other users will be able to connect to this device.'
      )}
      icon="user-shield"
      toggle={!!device.attributes.accessDisabled}
      onClick={() => {
        device.attributes = { ...device.attributes, accessDisabled: !device.attributes.accessDisabled }
        devices.setAttributes(device)
      }}
    />
  )
}
