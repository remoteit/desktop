import React from 'react'
import { Container } from './Container'
import { DevicesActionBar } from './DevicesActionBar'
import { DevicesApplicationsBar } from './DevicesApplicationsBar'

type Props = { select?: boolean; selected: IDevice['id'][]; devices?: IDevice[]; children?: React.ReactNode }

export const DevicesHeader: React.FC<Props> = ({ select, selected = [], devices, children }) => {
  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <DevicesActionBar select={select} selected={selected} devices={devices} />
          <DevicesApplicationsBar />
        </>
      }
    >
      {children}
    </Container>
  )
}
