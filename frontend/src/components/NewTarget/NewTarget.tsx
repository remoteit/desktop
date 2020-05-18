import React from 'react'
import { useHistory } from 'react-router-dom'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { DEFAULT_TARGET } from '../../constants'
import { makeStyles } from '@material-ui/core/styles'
import { Button, Link } from '@material-ui/core'
import { Icon } from '../Icon'
import { Target } from '../Target'
import styles from '../../styling'

type Props = {
  device: ITargetDevice
  onSave: (target: ITarget) => void
  onCancel: () => void
}

export const NewTarget: React.FC<Props> = ({ onCancel, ...props }) => {
  const { setupServicesNew, setupAddingService, setupAdded } = useSelector((state: ApplicationState) => state.ui)
  const { ui } = useDispatch<Dispatch>()
  const history = useHistory()
  const css = useStyles()

  if (setupServicesNew && !(setupAddingService || setupAdded))
    return (
      <tr>
        <td colSpan={6} className={css.button}>
          <Button color="primary" variant="contained" onClick={() => history.push('/settings/setupServices/network')}>
            Add from network
          </Button>
          <Link onClick={() => ui.set({ setupServicesNew: false })}>
            Add manually
            <Icon name="plus" inline />
          </Link>
        </td>
      </tr>
    )

  return (
    <Target
      {...props}
      init
      disable={false}
      data={setupAdded || DEFAULT_TARGET}
      adding={setupAddingService}
      onCancel={() => {
        ui.set({ setupServicesNew: true })
        onCancel()
      }}
      onDelete={() => {}}
    />
  )
}

const useStyles = makeStyles({
  button: {
    paddingTop: styles.spacing.xl,
    color: styles.colors.gray,
    '& button': { marginRight: styles.spacing.md },
  },
})
