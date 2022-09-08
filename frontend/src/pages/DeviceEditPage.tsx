import React from 'react'
import { NotificationSettings } from '../components/NotificationSettings'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { Gutters } from '../components/Gutters'
import { List } from '@mui/material'

export const DeviceEditPage: React.FC = () => {
  return (
    <DeviceHeaderMenu>
      <Gutters size={null}>
        <List>
          <DeviceNameSetting />
        </List>
      </Gutters>
      <NotificationSettings />
    </DeviceHeaderMenu>
  )
}
