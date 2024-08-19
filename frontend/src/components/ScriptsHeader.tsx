import React from 'react'
import { Container } from './Container'
import { DevicesActionBar } from './DevicesActionBar'
import { ScriptsTabBar } from './ScriptsTabBar'

type Props = {
  selected: IDevice['id'][]
  children?: React.ReactNode
}

export const ScriptsHeader: React.FC<Props> = ({ selected = [], children }) => {
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
