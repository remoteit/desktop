import React from 'react'
import { Application } from '@common/applications'
import { SelectSetting } from './SelectSetting'

type Props = {
  app: Application
  onChange: (launchType: string) => void
  disabled?: boolean
}

export const LaunchTypeSelect: React.FC<Props> = ({ app, disabled, onChange }) => {
  return (
    <SelectSetting
      icon={app.icon}
      disabled={disabled}
      modified={app.template !== app.defaultTemplate}
      label="Launch method"
      value={app.launchType || 'NONE'}
      values={[{ key: 'NONE', name: 'None' }, ...app.launchMethods.map(method => method.form)]}
      onChange={onChange}
    />
  )
}
