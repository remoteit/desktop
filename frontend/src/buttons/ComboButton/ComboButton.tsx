import React from 'react'
import { PROTOCOL } from '../../shared/constants'
import { makeStyles } from '@mui/styles'
import { ConnectButton } from '../ConnectButton'
import { DynamicButton } from '../DynamicButton'
import { windowOpen, isPortal } from '../../services/Browser'
import { Notice } from '../../components/Notice'

type Props = {
  className?: string
  connection?: IConnection
  service?: IService
  permissions?: IPermission[]
  size?: 'icon' | 'medium' | 'small' | 'large'
  fullWidth?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const ComboButton: React.FC<Props> = ({ className, ...props }) => {
  const css = useStyles(props.fullWidth)()
  return (
    <div className={css.buttons + (className ? ' ' + className : '')}>
      {props.service?.attributes.route === 'p2p' && props.connection?.public ? (
        <div>
          <Notice fullWidth severity="info" gutterBottom>
            {props.size === 'small' ? (
              'Peer to peer only'
            ) : (
              <>
                You cannot make a proxy connection to this service, it is set to peer to peer only.
                {!isPortal() && <i> Please try again in a few minutes.</i>}
              </>
            )}
          </Notice>
          {isPortal() && (
            <DynamicButton
              {...props}
              title="Launch Desktop"
              onClick={() => windowOpen(`${PROTOCOL}connect/${props.service?.id || props.connection?.id}`)}
            />
          )}
        </div>
      ) : (
        <ConnectButton iconType="solid" {...props} />
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
    },
  })
