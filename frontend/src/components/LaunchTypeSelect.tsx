import React from 'react'
import { Application } from '../shared/applications'
import { SelectSetting } from './SelectSetting'

type Props = {
  app: Application
  onChange: (launchType: string) => void
}

export const LaunchTypeSelect: React.FC<Props> = ({ app, onChange }) => {
  return (
    <SelectSetting
      icon={app.icon}
      modified={app.template !== app.defaultTemplate}
      label="Launch method"
      value={app.launchType}
      values={[
        { key: 'URL', name: 'URL' },
        { key: 'COMMAND', name: 'Command' },
      ]}
      onChange={onChange}
    />
  )
}
