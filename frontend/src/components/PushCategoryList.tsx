import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListItemSetting } from './ListItemSetting'

type Props = {
  categories: IPushCategory[]
  enabled: IPushCategory[]
  disabled?: boolean
  onChange: (enabled: IPushCategory[]) => void
}

export const PushCategoryList: React.FC<Props> = ({ categories, enabled, disabled, onChange }) => {
  const { t } = useTranslation()
  const labels: Record<IPushCategory, string> = {
    state: t('pushCategories.state', 'Online / offline'),
    connect: t('pushCategories.connect', 'Connections'),
    access: t('pushCategories.access', 'Access changes'),
    jobs: t('pushCategories.jobs', 'Scripts'),
    account: t('pushCategories.account', 'Account security'),
  }
  const descriptions: Record<IPushCategory, string> = {
    state: t('pushCategories.stateHelp', 'A device you have access to goes offline or comes back online.'),
    connect: t(
      'pushCategories.connectHelp',
      'Anyone, including you, connects to or disconnects from a device you have access to.'
    ),
    access: t(
      'pushCategories.accessHelp',
      'Someone shares a device with you or removes your access, or a device is transferred or deleted.'
    ),
    jobs: t(
      'pushCategories.jobsHelp',
      'A script you run, or one run on your account, starts, finishes, fails, or is cancelled.'
    ),
    account: t(
      'pushCategories.accountHelp',
      'A sign-in to your account, or a change to its password, phone number, or two-factor settings.'
    ),
  }

  const toggle = (category: IPushCategory) =>
    onChange(enabled.includes(category) ? enabled.filter(c => c !== category) : [...enabled, category])

  return (
    <>
      {categories.map(category => (
        <ListItemSetting
          key={category}
          quote
          label={labels[category]}
          subLabel={descriptions[category]}
          toggle={enabled.includes(category)}
          disabled={disabled}
          onClick={() => toggle(category)}
        />
      ))}
    </>
  )
}
