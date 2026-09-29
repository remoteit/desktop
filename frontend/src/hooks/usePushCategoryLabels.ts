import { useTranslation } from 'react-i18next'

export function usePushCategoryLabels(): Record<IPushCategory, string> {
  const { t } = useTranslation()
  return {
    state: t('pushCategories.state', 'Online / offline'),
    connect: t('pushCategories.connect', 'Connections'),
    access: t('pushCategories.access', 'Access changes'),
    jobs: t('pushCategories.jobs', 'Scripts'),
    account: t('pushCategories.account', 'Account security'),
  }
}
