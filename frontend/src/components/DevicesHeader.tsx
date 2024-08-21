import React from 'react'
import { Container } from './Container'
import { DevicesActionBar } from './DevicesActionBar'
import { DevicesApplicationsBar } from './DevicesApplicationsBar'
import { Route } from 'react-router-dom'
import { Notice } from './Notice'

type Props = { select?: boolean; devices?: IDevice[]; children?: React.ReactNode }

export const DevicesHeader: React.FC<Props> = ({ select, devices, children }) => {
  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <DevicesActionBar select={select} devices={devices} />
          <DevicesApplicationsBar />
          <Route path="/devices/restore">
            <Notice>Please select a device to restore.</Notice>
          </Route>
        </>
      }
    >
      {children}
    </Container>
  )
}
