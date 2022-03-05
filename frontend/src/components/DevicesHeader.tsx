import React from 'react'
import { ColumnsDrawer } from './ColumnsDrawer'
import { FilterDrawer } from './FilterDrawer'
import { Container } from './Container'

type Props = {
  select?: boolean
  myDevice?: IDevice
}

export const DevicesHeader: React.FC<Props> = ({ select, children }) => {
  return (
    <Container
      sidebar={
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
