import React from 'react'
import axios from 'axios'
import cookie from 'js-cookie'
import i18n from 'i18next'
import isEmpty from 'lodash/isEmpty'
import { AppStoreBanner } from '../AppStoreBanner'
import { Alert } from '../Alert'
import { AvailableLanguage } from '../../types'
import { BrandColor } from '../../styles/variables'

export function BannerNotices(): JSX.Element {
  const [notices, setNotices] = React.useState<NotificationList | null>(null)

  React.useEffect(() => {
    // FIXME: This is not ideal, instead we should inject
    // the fetch method in a way that allows us to mock
    // the API request.
    let timeout: number

    function fetch(): void {
      const env = process.env.NODE_ENV

      // TODO: should change this to be more testable.
      if (env === 'test') return

      const url = 'https://app-notices.s3-us-west-2.amazonaws.com/' + env + '-notices.json'

      axios.get(url).then((resp: { data: NotificationList }) => {
        setNotices(resp.data)
        // re-fetch this again every 5 min in case something updated
        timeout = window.setTimeout(fetch, 5 * 60 * 1000)
      })
    }

    fetch()

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (!notices || isEmpty(notices)) return <></>

  if (isEmpty(notices.alert) && isEmpty(notices.warning) && isEmpty(notices.info)) {
    return <AppStoreBanner />
  }

  return (
    <>
      <NoticeList notices={notices.alert} type="alert" />
      <NoticeList notices={notices.warning} type="warning" />
      <NoticeList notices={notices.info} type="info" />
    </>
  )
}

function NoticeList({ notices, type }: NoticeListProps): JSX.Element {
  if (!notices || !notices.length) return <></>

  return (
    <>
      {notices.map((notices, key) => (
        <Notice key={key} notice={notices} type={type} />
      ))}
    </>
  )
}

function Notice({ notice, type }: NoticeProps): JSX.Element {
  const now = new Date()
  const start = new Date(notice.start)
  const end = new Date(notice.end)
  const lang = (i18n.language || 'en-US').slice(0, 2)
  const hidden = cookie.get('remoteit.bannernotices.' + notice.id)

  if (!notice.portal) return <></>
  if (hidden) return <></>
  if (notice.language !== lang) return <></>
  if (now < start) return <></>
  if (end < now) return <></>
  if (!window.isEnterprise && notice.enterprise) return <></>

  const t: BrandColor = type === 'alert' ? 'danger' : type
  return (
    <Alert
      onClose={() => {
        if (notice.dismissible) {
          cookie.set('remoteit.bannernotices.' + notice.id, 'true', {
            expires: end,
          })
        }
      }}
      type={t}
    >
      <span className="lh-lg" dangerouslySetInnerHTML={{ __html: notice.message }} />
    </Alert>
  )
}

interface NoticeListProps {
  notices?: Notification[]
  type: NoticeType
}

interface NoticeProps {
  notice: Notification
  type: NoticeType
}

interface Notification {
  id: number
  message: string
  language: AvailableLanguage
  start: string
  end: string
  dismissible: boolean
  portal: boolean
  mobile: boolean
  desktop: boolean
  enterprise: boolean
}

type NoticeType = 'alert' | 'warning' | 'info'

type NotificationList = { [key in NoticeType]: Notification[] }
