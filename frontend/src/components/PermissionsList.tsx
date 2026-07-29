import React from 'react'
import { useTranslation } from 'react-i18next'
import { PERMISSION } from '../models/organization'
import { ListItemSetting } from './ListItemSetting'

type Props = {
  permissions: string[]
  allowed: IPermission[]
  locked?: boolean
  disabled?: boolean
  onChange: (toggle: boolean, permission: IPermission) => void
}

export const PermissionsList: React.FC<Props> = ({ permissions, allowed, locked, disabled, onChange }) => {
  const { t } = useTranslation()
  return (
    <>
      {permissions.map(p => {
        const permission = p as IPermission
        const toggle = allowed.includes(permission)
        return (
          <ListItemSetting
            key={p}
            toggle={toggle}
            disabled={disabled || PERMISSION[p].system || locked}
            icon={PERMISSION[p].icon}
            label={t(`permission.${p}.name`, PERMISSION[p].name)}
            subLabel={t(`permission.${p}.description`, PERMISSION[p].description)}
            onClick={PERMISSION[p].system || locked ? undefined : () => onChange(toggle, permission)}
          />
        )
      })}
    </>
  )
}
