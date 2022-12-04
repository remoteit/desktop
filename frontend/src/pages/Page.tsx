import React from 'react'
import Controller from '../services/Controller'
import { ORGANIZATION_BAR_WIDTH } from '../shared/constants'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../store'
import { Snackbar, IconButton, Dialog, Button } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { getOwnDevices } from '../selectors/devices'
import { DragAppRegion } from '../components/DragAppRegion'
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
  const {
    device,
    connected,
    successMessage,
    noticeMessage,
    errorMessage,
    offline,
    backendAuthenticated,
    layout,
    label,
  } = useSelector((state: ApplicationState) => {
    const device = getOwnDevices(state).find(d => d.thisDevice)
    return {
      device,
      connected: state.ui.connected,
      successMessage: state.ui.successMessage,
      noticeMessage: state.ui.noticeMessage,
      errorMessage: state.ui.errorMessage,
      offline: state.ui.offline,
      backendAuthenticated: state.auth.backendAuthenticated,
      layout: state.ui.layout,
      label: state.labels.find(l => l.id === device?.attributes.color),
    }
  })

  const clearSuccessMessage = () => ui.set({ successMessage: undefined })
  const clearErrorMessage = () => ui.set({ errorMessage: undefined })
  const reconnect = () => Controller.open(false, true)
  const css = useStyles({ spacing: layout.showOrgs ? ORGANIZATION_BAR_WIDTH : 0 })

  // only show one message at a time
  let snackbar = ''
  if (noticeMessage) snackbar = 'notice'
  if (successMessage) snackbar = 'success'
  if (errorMessage) snackbar = 'error'
  if (backendAuthenticated && !connected) snackbar = 'retry'

  return (
    <RemoteHeader device={device} color={label?.id ? label.color : undefined}>
      <DragAppRegion />
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
      <Snackbar
        className={css.snackbar}
        open={snackbar === 'retry'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        message="Webserver connection lost. Retrying..."
        action={
          <IconButton onClick={reconnect} size="large">
            <Icon name="sync" size="md" color="white" fixedWidth />
          </IconButton>
        }
      />
      <Snackbar
        className={css.snackbar}
        key={errorMessage || 'error'}
        open={snackbar === 'error'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        message={
          <>
            <Icon name="exclamation-triangle" size="md" color="danger" type="regular" fixedWidth inlineLeft />
            {errorMessage}
          </>
        }
        action={
          <IconButton onClick={clearErrorMessage} size="large">
            <Icon name="times" size="md" color="white" fixedWidth />
          </IconButton>
        }
        onClose={clearErrorMessage}
      />
      <Snackbar
        className={css.snackbar}
        key={noticeMessage || 'notice'}
        open={snackbar === 'notice'}
        message={
          <>
            <Icon name="info-circle" size="md" color="primary" type="regular" fixedWidth inlineLeft />
            {noticeMessage}
          </>
        }
        onClose={() => ui.set({ noticeMessage: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={20000}
      />
      <Snackbar
        className={css.snackbar}
        key={successMessage || 'success'}
        open={snackbar === 'success'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        autoHideDuration={20000}
        message={
          <>
            <Icon name="check" size="md" color="success" type="regular" fixedWidth inlineLeft />
            {successMessage}
          </>
        }
        action={
          <IconButton onClick={clearSuccessMessage} size="large">
            <Icon name="times" size="md" color="white" fixedWidth />
          </IconButton>
        }
        onClose={clearSuccessMessage}
      />
      <ConnectionNotice className={css.snackbar} />
      <UpdateNotice className={css.snackbar} />
    </RemoteHeader>
  )
}

const useStyles = makeStyles({
  snackbar: ({ spacing }: { spacing: number }) => ({
    marginLeft: spacing,
  }),
})
