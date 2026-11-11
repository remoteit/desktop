import React from 'react'
import { useTranslation } from 'react-i18next'
import { useDeviceSignIns } from '../hooks/useDeviceSignIns'
import { ListItemSetting } from './ListItemSetting'
import { Timestamp } from './Timestamp'

/* Who is signed in on the device, one per OS account (services/deviceSignIns): the person, the account, since when,
   and whether they manage it — a manager may choose the machine's exit and Protect there, anyone else sees them. An
   older daemon's one sign-in is the machine's, on no account. Nothing where the API has no sign-ins per account. */
export const DeviceSignIns: React.FC<{ deviceId: string }> = ({ deviceId }) => {
  const { t } = useTranslation()
  const signIns = useDeviceSignIns(deviceId)

  if (!signIns) return null
  if (!signIns.length)
    return <ListItemSetting icon="user" label={t('deviceSignIns.none', 'No one is signed in on it')} />

  return (
    <>
      {signIns.map(signIn => {
        const person = signIn.person.email || signIn.person.id
        const account = signIn.name || signIn.account
        return (
          <ListItemSetting
            key={signIn.account ?? signIn.person.id}
            icon="user"
            label={
              account
                ? t('deviceSignIns.signedIn', '{{person}} signed in on its account {{account}}', { person, account })
                : t('deviceSignIns.signedInMachine', '{{person}} signed in on it', { person })
            }
            subLabel={
              <>
                {signIn.manages
                  ? t('deviceSignIns.manages', 'Manages this device: may choose its exit and Protect there')
                  : t(
                      'deviceSignIns.doesNotManage',
                      'Does not manage this device: sees its exit, chosen by someone who does'
                    )}
                {signIn.since && (
                  <>
                    {' · '}
                    {t('deviceSignIns.since', 'since')} <Timestamp date={new Date(signIn.since)} variant="short" />
                  </>
                )}
              </>
            }
          />
        )
      })}
    </>
  )
}
