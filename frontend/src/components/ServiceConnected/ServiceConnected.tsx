import React from 'react'
import { hostName } from '../../helpers/nameHelper'
import { Typography } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Throughput } from '../Throughput'
import { Duration } from '../Duration'
import { Columns } from '../Columns'

type Props = {
  connection: IConnection
}

export const ServiceConnected: React.FC<Props> = ({ connection }) => {
  // const css = useStyles()

  return (
    <>
      <Typography color="primary" variant="subtitle1">
        Connected
      </Typography>
      <Columns count={1}>
        <DataDisplay
          data={[
            { label: 'URL', value: hostName(connection) },
            { label: 'Duration', value: <Duration startTime={connection.startTime} /> },
            { label: 'Throughput', value: <Throughput connection={connection} /> },
          ]}
        />
      </Columns>
    </>
  )
}
