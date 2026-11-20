import React, { useEffect, useState } from 'react'
import { List, ListSubheader } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { graphQLBasicRequest } from '../services/graphQL'

type Contacts = { billingEmail: string; notificationEmail: string }

export function OrganizationContactSettings({ accountId }: { accountId: string }) {
  const { t } = useTranslation()
  const [contacts, setContacts] = useState<Contacts>()

  useEffect(() => {
    let current = true
    async function load() {
      const result = await graphQLBasicRequest(
        `query OrganizationContacts($accountId: String!) {
          login { account(id: $accountId) {
            billingDetails { email }
            notificationSettings { notificationEmail }
          } }
        }`,
        { accountId }
      )
      if (!current || result === 'ERROR') return
      const data = result.data?.data?.login?.account
      if (data)
        setContacts({
          billingEmail: data.billingDetails?.email || '',
          notificationEmail: data.notificationSettings?.notificationEmail || '',
        })
    }
    void load()
    return () => {
      current = false
    }
  }, [accountId])

  async function save(field: keyof Contacts, email: string) {
    const mutation = field === 'billingEmail' ? 'updateBillingDetails' : 'setOrganizationNotificationEmail'
    const result = await graphQLBasicRequest(
      `mutation OrganizationContact($accountId: String!, $email: String) {
        ${mutation}(accountId: $accountId, email: $email)
      }`,
      { accountId, email: email.trim() }
    )
    if (result !== 'ERROR' && result.data?.data?.[mutation]) {
      setContacts(previous => previous && { ...previous, [field]: email.trim() })
    }
  }

  if (!contacts) return null

  return (
    <List>
      <ListSubheader>{t('organizationContacts.title', 'Contact email')}</ListSubheader>
      <InlineTextFieldSetting
        icon="envelope"
        type="email"
        maxLength={254}
        label={t('organizationContacts.billing', 'Billing email')}
        value={contacts.billingEmail}
        onSave={value => save('billingEmail', value.toString())}
      />
      <InlineTextFieldSetting
        icon="envelope"
        type="email"
        maxLength={254}
        label={t('organizationContacts.notifications', 'Device notification email')}
        value={contacts.notificationEmail}
        onSave={value => save('notificationEmail', value.toString())}
      />
    </List>
  )
}
