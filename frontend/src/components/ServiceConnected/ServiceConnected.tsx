import React from 'react'
import { IService, IDevice } from 'remote.it'
import { hostName } from '../../helpers/nameHelper'
import { Typography } from '@material-ui/core'
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

  if (!connection.active) return null

  console.log('CONNECTION ->>', connection)
  console.log('SERVICE ->>', service)
  console.log('DEVICE ->>', device)

  return (
    <div className={css.container}>
      <Typography variant="subtitle2">Connected to {hostName(connection)}</Typography>
    </div>
  )
}

const useStyles = makeStyles({
  title: { flexGrow: 1, marginLeft: spacing.md },
  container: {
    margin: `${spacing.md}px 65px`,
    borderTop: `5px solid ${colors.primary}`,
  },
})
