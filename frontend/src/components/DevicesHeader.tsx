import React from 'react'
import { Container } from './Container'
import { DevicesActionBars } from './DevicesActionBars'
import { DevicesApplicationsTabs } from './DevicesApplicationsTabs'
import { useTranslation } from 'react-i18next'
import { Notice } from './Notice'
import { Route } from 'react-router-dom'

type Props = { select?: boolean; devices?: IDevice[]; children?: React.ReactNode }

export const DevicesHeader: React.FC<Props> = ({ select, devices, children }) => {
  const { t } = useTranslation()
  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <DevicesActionBars select={select} devices={devices} />
          <DevicesApplicationsTabs />
          <Route path="/devices/restore">
            <Notice>{t('deviceList.selectToRestore', 'Please select a device to restore.')}</Notice>
          </Route>
        </>
      }
    >
      {children}
    </Container>
  )
}
