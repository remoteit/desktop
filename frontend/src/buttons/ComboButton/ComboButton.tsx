import React from 'react'
import { makeStyles } from '@material-ui/core'
import { DisconnectButton } from '../DisconnectButton'
import { ConnectButton } from '../ConnectButton'
import { spacing } from '../../styling'
import { Notice } from '../../components/Notice'

type Props = {
  className?: string
  connection?: IConnection
  service?: IService
  size?: 'icon' | 'medium' | 'small' | 'large'
  autoConnect?: boolean
  fullWidth?: boolean
  onClick?: () => void
}

export const ComboButton: React.FC<Props> = ({ className, ...props }) => {
  const css = useStyles(props.fullWidth)()
  return (
    <div className={css.buttons + (className ? ' ' + className : '')}>
      {props.service?.attributes.route === 'p2p' && props.connection?.public ? (
        <Notice fullWidth severity="warning">
          {props.size === 'small'
            ? 'Peer to peer only'
            : 'You cannot make a proxy connection to this service, it is set to peer to peer only.'}
        </Notice>
      ) : (
        <>
          <DisconnectButton {...props} />
          <ConnectButton {...props} />
        </>
      )}
    </div>
  )
}

const useStyles = fullWidth =>
  makeStyles({
    buttons: {
      width: fullWidth ? 'inherit' : 121,
      marginRight: spacing.sm,
      position: 'relative',
      flexGrow: 1,
      '& > div': { position: 'absolute', width: '100%' },
      '& > div:last-child': { position: 'relative' },
    },
  })
