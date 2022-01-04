import React from 'react'
import { PROTOCOL } from '../../shared/constants'
import { makeStyles } from '@material-ui/core'
import { DisconnectButton } from '../DisconnectButton'
import { ConnectButton } from '../ConnectButton'
import { DynamicButton } from '../DynamicButton'
import { Notice } from '../../components/Notice'
import { windowOpen } from '../../services/Browser'

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
        <div>
          <Notice fullWidth severity="info" gutterBottom>
            {props.size === 'small'
              ? 'Peer to peer only'
              : 'You cannot make a proxy connection to this service, it is set to peer to peer only.'}
          </Notice>
          <DynamicButton
            {...props}
            title="Launch Desktop"
            color="grayDarkest"
            onClick={() => windowOpen(`${PROTOCOL}connect/${props.service?.id || props.connection?.id}`)}
          />
        </div>
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
      position: 'relative',
      flexGrow: 1,
      '& > div': { position: 'absolute', width: '100%' },
      '& > div:last-child': { position: 'relative' },
    },
  })
