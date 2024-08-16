import React from 'react'
import { Container } from './Container'
import { DevicesActionBar } from './DevicesActionBar'
import { ScriptsTabBar } from './ScriptsTabBar'
import { Route } from 'react-router-dom'
import { Notice } from './Notice'

type Props = { select?: boolean; selected: IDevice['id'][]; devices?: IDevice[]; children?: React.ReactNode }

export const ScriptsHeader: React.FC<Props> = ({ select, selected = [], devices, children }) => {
  return (
    <Container
      integrated
      gutterBottom
      bodyProps={{ verticalOverflow: true, horizontalOverflow: true }}
      header={
        <>
          <DevicesActionBar selected={selected} displayOnly />
          <ScriptsTabBar />
        </>
      }
    >
      {children}
    </Container>
  )
}
