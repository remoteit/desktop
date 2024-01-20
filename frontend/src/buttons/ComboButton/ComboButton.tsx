import React from 'react'
import browser, { windowOpen } from '../../services/Browser'
import { PROTOCOL } from '../../constants'
import { makeStyles } from '@mui/styles'
import { ConnectButton, ConnectButtonProps } from '../ConnectButton'
import { DynamicButton } from '../DynamicButton'
import { Notice } from '../../components/Notice'

type Props = ConnectButtonProps & {
  className?: string
  fullWidth?: boolean
  disabled?: boolean
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  children?: React.ReactNode
}

export const ComboButton: React.FC<Props> = ({ className, containerProps, children, ...props }) => {
  const css = useStyles(props.fullWidth)()
  return (
    <div className={css.buttons + (className ? ' ' + className : '')} {...containerProps}>
      {props.service?.attributes.route === 'p2p' && !browser.hasBackend ? (
        <div>
          {props.size !== 'chip' && (
            <Notice fullWidth severity="info" gutterBottom>
              <>
                You cannot make a proxy connection to this service, it is set to peer to peer only.
                {browser.hasBackend && <i> Please try again in a few minutes.</i>}
              </>
            </Notice>
          )}
          {browser.isPortal && (
            <DynamicButton
              {...props}
              color="primary"
              title="Launch Desktop"
              onClick={() => windowOpen(`${PROTOCOL}connect/${props.service?.id || props.connection?.id}`)}
            />
          )}
        </div>
      ) : (
        <ConnectButton {...props} />
      )}
      {children}
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
