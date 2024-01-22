import React from 'react'
import { ColumnsDrawer } from './ColumnsDrawer'
import { FilterDrawer } from './FilterDrawer'
import { Container } from './Container'

export const DevicesDrawers: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <Container
      drawer={
        <>
          <FilterDrawer />
          <ColumnsDrawer />
        </>
      }
    >
      {children}
    </Container>
  )
}
