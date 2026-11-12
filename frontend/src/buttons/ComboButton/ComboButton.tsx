import React from 'react'
import browser, { windowOpen } from '../../services/browser'
import { DESKTOP_PROTOCOL, EMBEDDED } from '../../constants'
import { ConnectButton, ConnectButtonProps } from '../ConnectButton'
import { DynamicButton } from '../DynamicButton'
import { Notice } from '../../components/Notice'
import { Box } from '@mui/material'

type Props = ConnectButtonProps & {
  className?: string
  fullWidth?: boolean
  disabled?: boolean
  containerProps?: React.HTMLAttributes<HTMLDivElement>
  children?: React.ReactNode
}

export const ComboButton: React.FC<Props> = ({ className, containerProps, children, ...props }) => {
  return (
    <Box
      className={className}
      sx={{
        width: props.fullWidth ? 'inherit' : undefined,
        position: 'relative',
        flexGrow: 1,
      }}
      {...containerProps}
    >
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
          {/* Not in the embedded portal: it is the desktop app already. */}
          {browser.isPortal && !EMBEDDED && (
            <DynamicButton
              {...props}
              color="primary"
              title="Launch Desktop"
              onClick={() => windowOpen(`${DESKTOP_PROTOCOL}connect/${props.service?.id || props.connection?.id}`)}
            />
          )}
        </div>
      ) : (
        <ConnectButton {...props} />
      )}
      {children}
    </Box>
  )
}
