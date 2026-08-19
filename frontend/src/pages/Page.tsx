import React from 'react'
import Controller from '../services/Controller'
import { ORGANIZATION_BAR_WIDTH } from '../constants'
import { useSelector, useDispatch } from 'react-redux'
import { Snackbar, IconButton, Dialog, Button } from '@mui/material'
import { State, Dispatch } from '../store'
import { spacing } from '../styling'
import { selectDevice } from '../selectors/devices'
import { MaximizeAppRegion } from '../components/MaximizeAppRegion'
import { ConnectionNotice } from '../components/ConnectionNotice'
import { GlobalConfirm } from '../components/GlobalConfirm'
import { UpdateNotice } from '../components/UpdateNotice'
import { RemoteHeader } from '../components/RemoteHeader'
import { Notice } from '../components/Notice'
import { Icon } from '../components/Icon'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const { ui } = useDispatch<Dispatch>()

  const device = useSelector(selectDevice)
  const connected = useSelector((state: State) => state.ui.connected)
  const backendAuthenticated = useSelector((state: State) => state.auth.backendAuthenticated)
  const successMessage = useSelector((state: State) => state.ui.successMessage)
  const noticeMessage = useSelector((state: State) => state.ui.noticeMessage)
  const errorMessage = useSelector((state: State) => state.ui.errorMessage)
  const offline = useSelector((state: State) => state.ui.offline)
  const layout = useSelector((state: State) => state.ui.layout)

  const clearNoticeMessage = () => ui.set({ noticeMessage: undefined })
  const clearSuccessMessage = () => ui.set({ successMessage: undefined })
  const clearErrorMessage = () => ui.set({ errorMessage: undefined })
  const reconnect = () => Controller.open(false, true)
  const margin = layout.showOrgs && !layout.hideSidebar ? ORGANIZATION_BAR_WIDTH : spacing.sm
  const snackbarSx = {
    marginLeft: layout.mobile ? `${spacing.xs}px` : `${margin}px`,
    marginRight: layout.mobile ? `${spacing.xs}px` : `${margin}px`,
    bottom: `${layout.mobile ? 110 : 80}px !important`,
  }

  // only show one message at a time
  let snackbar = ''
  if (noticeMessage) snackbar = 'notice'
  if (successMessage) snackbar = 'success'
  if (errorMessage) snackbar = 'error'
  if (backendAuthenticated && !connected) snackbar = 'retry'

  return (
    <RemoteHeader device={device}>
      <MaximizeAppRegion />
      {children}
      {offline && (
        <Dialog open maxWidth="xs" fullWidth>
          <Notice
            severity={offline.severity}
            button={
              <Button
                size="small"
                onClick={() => window.location.reload()}
                color={offline.severity}
                variant="contained"
              >
                Reload
              </Button>
            }
            onClose={() => ui.set({ offline: undefined })}
            fullWidth
          >
            {offline.title}
            {offline.message && <em>{offline.message}</em>}
          </Notice>
        </Dialog>
      )}
      <GlobalConfirm />
      <ConnectionNotice sx={snackbarSx} />
      <UpdateNotice sx={snackbarSx} />
      <Snackbar
        sx={snackbarSx}
        open={snackbar === 'retry'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        message={
          <Notice
            invert
            severity="warning"
            fullWidth
            button={
              <IconButton onClick={reconnect} sx={{ marginLeft: 1, marginRight: -1 }}>
                <Icon name="sync" size="md" color="white" fixedWidth />
              </IconButton>
            }
          >
            Webserver connection lost. Retrying...
          </Notice>
        }
      />
      <Snackbar
        sx={snackbarSx}
        key="error"
        open={snackbar === 'error'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={clearErrorMessage}
        onClick={layout.mobile ? clearErrorMessage : undefined}
        message={
          <Notice severity="error" invert fullWidth>
            {errorMessage}
          </Notice>
        }
      />
      <Snackbar
        sx={snackbarSx}
        key="notice"
        open={snackbar === 'notice'}
        onClose={clearNoticeMessage}
        onClick={layout.mobile ? clearNoticeMessage : undefined}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        message={
          <Notice severity="info" invert fullWidth>
            {noticeMessage}
          </Notice>
        }
      />
      <Snackbar
        sx={snackbarSx}
        key="success"
        open={snackbar === 'success'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        onClose={clearSuccessMessage}
        onClick={layout.mobile ? clearSuccessMessage : undefined}
        message={
          <Notice severity="success" invert fullWidth>
            {successMessage}
          </Notice>
        }
      />
    </RemoteHeader>
  )
}

