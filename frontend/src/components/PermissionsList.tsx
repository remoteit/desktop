import React from 'react'
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
  return (
    <>
      {permissions.map(p => {
        const permission = p as IPermission
        const toggle = allowed.includes(permission)
        return (
          <ListItemSetting
            key={p}
            toggle={toggle}
            disabled={disabled}
            icon={PERMISSION[p].icon}
            label={PERMISSION[p].name}
            subLabel={PERMISSION[p].description}
            onClick={PERMISSION[p].system || locked ? undefined : () => onChange(toggle, permission)}
          />
        )
      })}
    </>
  )
}
