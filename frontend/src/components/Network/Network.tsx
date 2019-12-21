import React from 'react'
import { Scan } from '../Scan'

type Props = {
  data: IScanData
  onAdd: (target: ITarget) => void
  onScan: (network: string) => void
  interfaces: IInterface[]
  targets: ITarget[]
  privateIP: string
}

export const Network: React.FC<Props> = ({ ...props }) => {
  return <Scan {...props} />
}
