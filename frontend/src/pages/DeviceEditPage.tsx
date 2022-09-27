import React, { useContext } from 'react'
import { DeviceContext } from '../services/Context'
import { DeviceDescriptionSetting } from '../components/DeviceDescriptionSetting'
import { NotificationSettings } from '../components/NotificationSettings'
import { DeviceNameSetting } from '../components/DeviceNameSetting'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { Gutters } from '../components/Gutters'
import { List } from '@mui/material'

export const DeviceEditPage: React.FC = () => {
  const { device } = useContext(DeviceContext)

  return (
    <DeviceHeaderMenu>
      {device?.permissions.includes('MANAGE') && (
        <Gutters size={null}>
          <List>
            <DeviceNameSetting />
            <DeviceDescriptionSetting />
          </List>
        </Gutters>
      )}
      <NotificationSettings />
    </DeviceHeaderMenu>
  )
}
