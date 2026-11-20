import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { graphQLSetShowInServices, graphQLShowInServices } from '../services/graphQLServiceShortcuts'
import { useServiceShortcutsSupport } from '../hooks/useServiceShortcutsSupport'
import { ListItemCheckbox } from './ListItemCheckbox'
import { Notice } from './Notice'

export function ShowInServicesSetting({ serviceId }: { serviceId: string }) {
  const { t } = useTranslation()
  const support = useServiceShortcutsSupport()
  const [visible, setVisible] = useState<boolean>()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const supported = !!support && support !== 'ERROR' && support.available

  useEffect(() => {
    if (!supported) return
    let current = true
    graphQLShowInServices(serviceId).then(result => {
      if (!current) return
      if (result === 'ERROR') setFailed(true)
      else setVisible(result)
    })
    return () => {
      current = false
    }
  }, [supported, serviceId])

  if (!supported) return null

  const set = async (checked: boolean) => {
    if (visible === undefined || busy) return
    setBusy(true)
    setFailed(false)
    if (await graphQLSetShowInServices(serviceId, checked)) setVisible(checked)
    else setFailed(true)
    setBusy(false)
  }

  return (
    <>
      <ListItemCheckbox
        label={t('serviceShortcuts.show', 'Show in Services')}
        subLabel={t('serviceShortcuts.help', 'Add a shortcut for people who can connect to this service.')}
        checked={visible}
        disabled={visible === undefined || busy}
        onClick={set}
      />
      {failed && (
        <Notice severity="error">
          {t('serviceShortcuts.settingFailed', 'Could not update the Services setting.')}
        </Notice>
      )}
    </>
  )
}
