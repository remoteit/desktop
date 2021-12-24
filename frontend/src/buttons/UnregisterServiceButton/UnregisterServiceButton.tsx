import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Confirm } from '../../components/Confirm'
import { Icon } from '../../components/Icon'
import { spacing, fontSizes } from '../../styling'

type Props = {
  target?: ITarget
}

export const UnregisterServiceButton: React.FC<Props> = ({ target }) => {
  const css = useStyles()
  const [open, setOpen] = useState<boolean>(false)
  const { backend } = useDispatch<Dispatch>()
  const { setupBusy, deleting } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    deleting: state.ui.setupServiceBusy === target?.uid,
  }))

  if (!target) return null

  return deleting ? (
    <CircularProgress className={css.loading} size={fontSizes.md} />
  ) : (
    <>
      <Tooltip title="Unregister Service">
        <span>
          <IconButton disabled={setupBusy} onClick={() => setOpen(true)}>
            <Icon name="trash" size="md" fixedWidth />
          </IconButton>
        </span>
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

const useStyles = makeStyles(({ palette }) => ({
  loading: { color: palette.danger.main, margin: spacing.sm },
}))
