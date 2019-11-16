import React from 'react'
import { IService, IDevice } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { Typography } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Throughput } from '../Throughput'
import { Duration } from '../Duration'
import { Columns } from '../Columns'
import { makeStyles } from '@material-ui/styles'
import { spacing, colors } from '../../styling'

type Props = {
  connection: IConnection
  service: IService
  device: IDevice
}

export const ServiceConnected: React.FC<Props> = ({ connection, service, device }) => {
  const css = useStyles()

  // console.log('CONNECTION ->>', connection)
  // console.log('SERVICE ->>', service)
  // console.log('DEVICE ->>', device)

  return (
    <Columns>
      <Typography color="primary" variant="subtitle2">
        Connected
      </Typography>
      <DataDisplay
        data={[
          { label: 'Launch', value: hostName(connection) },
          { label: 'Host', value: connection.host },
          { label: 'Port', value: connection.port },
          { label: 'Restriction', value: connection.restriction },
          { label: 'Duration', value: <Duration startTime={connection.startTime} /> },
          { label: 'Throughput', value: <Throughput connection={connection} /> },
        ]}
      />
    </Columns>
  )
}

const useStyles = makeStyles({
  container: {
    color: colors.primary,
    // display: 'flex',
    // flexDirection: 'row',
  },
})
