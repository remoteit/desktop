import React from 'react'
import { Scan } from '../Scan'
import { Container } from '../Container'
import { Breadcrumbs } from '../Breadcrumbs'
import { Typography } from '@material-ui/core'

type Props = {
  data: IScanData
  onAdd: (target: ITarget) => void
  onScan: (network: string) => void
  interfaces: IInterface[]
  targets: ITarget[]
  privateIP: string
}

export const Network: React.FC<Props> = ({ ...props }) => {
  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">Network Scan</Typography>
        </>
      }
    >
      <Scan {...props} />
    </Container>
  )
}
