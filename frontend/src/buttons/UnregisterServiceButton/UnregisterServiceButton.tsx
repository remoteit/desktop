import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

type Props = {
  target?: ITarget
}

export const UnregisterServiceButton: React.FC<Props> = ({ target }) => {
  const css = useStyles()
  const { backend } = useDispatch<Dispatch>()
  const { setupBusy, deleting } = useSelector((state: ApplicationState) => ({
    setupBusy: state.ui.setupBusy,
    deleting: state.ui.setupServiceBusy === target?.uid,
  }))

  if (!target) return null

  return deleting ? (
    <CircularProgress className={css.loading} size={styles.fontSizes.md} />
  ) : (
    <Tooltip title="Unregister Service">
      <IconButton onClick={() => backend.removeTargetService(target)} disabled={setupBusy}>
        <Icon name="trash-alt" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
