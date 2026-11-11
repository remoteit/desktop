import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { graphQLProductNotifications, setProductNotifications } from '../services/productMaxDevices'
import { ListItemSetting } from './ListItemSetting'

/* The account's mail when one of its products, at its maximum of devices, refuses a device (graphql-api
   docs/PROXY-GROUPS.md §11, "A product's maximum of devices"): the first time, then once a day at most per product. On
   unless switched off. Its own switch, as restore mail's is; push follows the push switches (Account). Read and set on its
   own, where the API has it. */
export const ProductNotificationsSetting: React.FC = () => {
  const { t } = useTranslation()
  const [on, setOn] = useState<boolean>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let current = true
    graphQLProductNotifications().then(value => {
      if (current) setOn(value)
    })
    return () => {
      current = false
    }
  }, [])

  if (on === undefined) return null
  return (
    <ListItemSetting
      icon={on ? 'envelope' : 'envelope-slash'}
      label={t('settings.notifyProductFull', 'Product limit emails')}
      subLabel={t(
        'settings.notifyProductFullHelp',
        'One of your products has the devices it may hold, and refused one. Sent the first time, then at most once a day per product.'
      )}
      toggle={on}
      disabled={saving}
      onClick={async () => {
        setSaving(true)
        if (await setProductNotifications(!on)) setOn(!on)
        setSaving(false)
      }}
    />
  )
}
