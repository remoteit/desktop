import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Confirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

type Props = {
  target?: ITarget
}

export const UnregisterServiceButton: React.FC<Props> = ({ target }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { backend } = useDispatch<Dispatch>()
  const { setupBusy, deleting } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    deleting: state.ui.setupServiceBusy === target?.uid,
  }))
  const css = useStyles()

  if (!target) return null

  return deleting ? (
    <CircularProgress className={css.loading} size={styles.fontSizes.md} />
  ) : (
    <>
      <Tooltip title="Unregister Service">
        <IconButton onClick={() => setOpen(true)} disabled={setupBusy}>
          <Icon name="trash-alt" size="md" fixedWidth />
        </IconButton>
      </Tooltip>
      <Confirm
        open={open}
        onConfirm={() => backend.removeTargetService(target)}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
      >
        Deleting services can't be undone. If this service is providing you remote access, you may have to physically
        connect to the device to recover it.
      </Confirm>
    </>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
