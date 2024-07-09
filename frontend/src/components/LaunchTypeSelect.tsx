import React from 'react'
import { Application } from '@common/applications'
import { SelectSetting } from './SelectSetting'
import { Pre } from './Pre'

type Props = {
  app: Application
  onChange: (launchType: string) => void
  disabled?: boolean
}

export const LaunchTypeSelect: React.FC<Props> = ({ app, disabled, onChange }) => {
  return (
    <>
      {/* <Pre>{app}</Pre> */}
      <SelectSetting
        icon={app.icon}
        disabled={disabled}
        modified={app.template !== app.defaultTemplate}
        label="Launch method"
        value={app.launchType || 'NONE'}
        values={[
          { key: 'NONE', name: 'None' },
          { key: 'URL', name: 'URL' },
          { key: 'COMMAND', name: 'Command' },
        ]}
        onChange={onChange}
      />
    </>
  )
}
