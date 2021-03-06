import React from 'react'
import { makeStyles } from '@material-ui/core'
import { connectionState } from '../../helpers/connectionHelper'
import { DisconnectButton } from '../DisconnectButton'
import { ConnectButton } from '../ConnectButton'
import { OfflineButton } from '../OfflineButton'
import { spacing } from '../../styling'

type Props = {
  connection?: IConnection
  service?: IService
  className?: string
}

export const ComboButton: React.FC<Props> = ({ connection, service, className }) => {
  const state = connectionState(service, connection)
  const css = useStyles()
  return (
    <div className={css.buttons + (className ? ' ' + className : '')}>
      <ConnectButton connection={connection} service={service} size="small" />
      <DisconnectButton connection={connection} service={service} size="small" />
      <OfflineButton connection={connection} service={service} />
      {state}
    </div>
  )
}

const useStyles = makeStyles({
  buttons: {
    width: 121,
    marginLeft: spacing.md,
    marginRight: spacing.lg,
    position: 'relative',
    '& > div': { position: 'absolute', width: '100%' },
    '& > div:last-child': { position: 'relative' },
  },
})
