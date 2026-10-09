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

  const toggle = (category: IPushCategory) =>
    onChange(enabled.includes(category) ? enabled.filter(c => c !== category) : [...enabled, category])

  return (
    <>
      {categories.map(category => (
        <ListItemSetting
          key={category}
          quote
          label={labels[category]}
          toggle={enabled.includes(category)}
          disabled={disabled}
          onClick={() => toggle(category)}
        />
      ))}
    </>
  )
}
