import React, { useEffect } from 'react'
import { ColumnsDrawer } from './ColumnsDrawer'
import { FilterDrawer } from './FilterDrawer'
import { Container } from './Container'
import analyticsHelper from '../helpers/analyticsHelper'

type Props = {
  fetching?: boolean
  myDevice?: IDevice
}

export const DevicesHeader: React.FC<Props> = ({ children }) => {
  useEffect(() => {
    analyticsHelper.page('DevicesPage')
  }, [])

  return (
    <Container
      gutterBottom
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
