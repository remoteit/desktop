import React, { useState } from 'react'
import humanize from 'humanize-duration'
import { IService, IDevice } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { useInterval } from '../../helpers/useInterval'
import { Typography } from '@material-ui/core'
import { DataDisplay } from '../DataDisplay'
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
  const [now, setNow] = useState(Date.now())
  const css = useStyles()

  useInterval(() => {
    setNow(Date.now)
  }, 1000)

  if (!connection.startTime) return null

  console.log('CONNECTION ->>', connection)
  console.log('SERVICE ->>', service)
  console.log('DEVICE ->>', device)

  return (
    <>
      <div className={css.container}>
        <Typography variant="subtitle2">Connected </Typography>
      </div>
      <DataDisplay
        data={[
          { label: 'Launch', value: hostName(connection) },
          { label: 'Host', value: connection.host },
          { label: 'Port', value: connection.port },
          { label: 'Restriction', value: connection.restriction },
          { label: 'Duration', value: humanize(Math.round((now - connection.startTime) / 1000) * 1000) },
          { label: 'Throughput', value: '...' },
        ]}
      />
    </>
  )
}

const useStyles = makeStyles({
  container: {
    margin: `${spacing.md}px 65px`,
    color: colors.primary,
    // borderTop: `5px solid ${colors.primary}`,
  },
})
