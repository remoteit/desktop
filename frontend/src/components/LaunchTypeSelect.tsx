import React from 'react'
import { useTranslation } from 'react-i18next'
import { Application } from '@common/applications'
import { SelectSetting } from './SelectSetting'

type Props = {
  app: Application
  onChange: (launchType: string) => void
  disabled?: boolean
}

export const LaunchTypeSelect: React.FC<Props> = ({ app, disabled, onChange }) => {
  const { t } = useTranslation()
  return (
    <SelectSetting
      icon={app.icon}
      disabled={disabled}
      modified={app.template !== app.defaultTemplate}
      label={t('launchTypeSelect.label', 'Launch method')}
      value={app.launchType || 'NONE'}
      values={[{ key: 'NONE', name: t('launchTypeSelect.none', 'None') }, ...app.launchMethods.map(method => method.form)]}
      onChange={onChange}
    />
  )
}
