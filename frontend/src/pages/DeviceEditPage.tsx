import React, { useEffect } from 'react'
import { NotificationSettings } from '../components/NotificationSettings'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { List } from '@mui/material'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = { device?: IDevice }

export const DeviceEditPage: React.FC<Props> = ({ device }) => {
  useEffect(() => {
    analyticsHelper.page('DeviceEditPage')
  }, [])

  if (!device) return null

  return (
    <DeviceHeaderMenu device={device}>
      <List>
        <DeviceNameSetting device={device} />
      </List>
      <NotificationSettings device={device} />
    </DeviceHeaderMenu>
  )
}
