import React from 'react'
import { IService, IDevice } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { Typography } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
import { Throughput } from '../Throughput'
import { Duration } from '../Duration'
// import { ForgetButton } from '../../components/ForgetButton'
// import { CopyButton } from '../../components/CopyButton'
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
    <div className={css.container}>
      <div>
        <Typography variant="subtitle2">Connected </Typography>
      </div>
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
    </div>
  )
}

const useStyles = makeStyles({
  container: {
    margin: `${spacing.md}px 65px`,
    color: colors.primary,
    display: 'flex',
    flexDirection: 'row',
  },
})
