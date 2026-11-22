import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory, useLocation } from 'react-router-dom'
import { Box, Tab, Typography } from '@mui/material'
import { DeviceContext } from '../services/Context'
import { useDeviceCarries } from '../hooks/useDeviceCarries'
import { DeviceTab, deviceTabs, tabLabel } from '../helpers/deviceTabs'
import { LoadingMessage } from './LoadingMessage'
import { ShareButton } from '../buttons/ShareButton'
import { Container } from './Container'
import { MobileUI } from './MobileUI'
import { Gutters } from './Gutters'
import { Title } from './Title'
import { PageTabs } from './PageTabs'

export const DeviceHeaderMenu: React.FC<{ header?: any; children?: React.ReactNode }> = ({ header, children }) => {
  const { t } = useTranslation()
  const { device } = useContext(DeviceContext)
  const location = useLocation()
  const history = useHistory()
  const carries = useDeviceCarries(device)

  if (!device) return <LoadingMessage />

  const tabs = deviceTabs(device, carries)
  const current = location.pathname.split('/')[3] as DeviceTab
  const value = tabs.includes(current) ? current : false

  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true }}
      header={
        <>
          <Typography variant="h1" sx={{ alignItems: 'center', width: '100%', gap: 1 }}>
            <Title>{device.name || t('deviceHeaderMenu.unknown', 'Unknown')}</Title>
            <Box display="flex" alignItems="center">
              <MobileUI hide>
                <ShareButton
                  to={`/devices/${device.id}/share`}
                  hide={!device.permissions.includes('MANAGE')}
                  title={t('deviceHeaderMenu.share', 'Share')}
                />
              </MobileUI>
            </Box>
          </Typography>
          {device.attributes.description && (
            <Gutters top={null}>
              <Typography variant="body2" color="textSecondary">
                {device.attributes.description}
              </Typography>
            </Gutters>
          )}
          <PageTabs value={value} sx={{ marginX: 4.5, marginTop: 1 }} data-device-tabs>
            {tabs.map(tab => (
              <Tab
                key={tab}
                value={tab}
                label={tabLabel(t, tab)}
                data-device-tab={tab}
                onClick={() => history.push(`/devices/${device.id}/${tab}`)}
              />
            ))}
          </PageTabs>
          {header}
        </>
      }
    >
      {children}
    </Container>
  )
}
