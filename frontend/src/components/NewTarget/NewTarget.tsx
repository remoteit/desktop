import React from 'react'
import { useHistory } from 'react-router-dom'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { DEFAULT_TARGET } from '../../shared/constants'
import { makeStyles } from '@material-ui/core/styles'
import { Button, Link } from '@material-ui/core'
import { Icon } from '../Icon'
import { Target } from '../Target'
import styles from '../../styling'

type Props = {
  targetDevice: ITargetDevice
  onSave: (target: ITarget) => void
}

export const NewTarget: React.FC<Props> = props => {
  const { setupServicesNew, setupAddingService, setupAdded, scanEnabled } = useSelector(
    (state: ApplicationState) => state.ui
  )
  const { ui } = useDispatch<Dispatch>()
  const match = useRouteMatch()
  const history = useHistory()
  const css = useStyles()

  if (setupServicesNew && !(setupAddingService || setupAdded))
    return (
      <tr>
        <td colSpan={6} className={css.button}>
          <Button color="primary" variant="contained" onClick={() => ui.set({ setupServicesNew: false })}>
            Add
            <Icon name="plus" inline />
          </Button>
          {scanEnabled && (
            <Link onClick={() => history.push(`${match.path}/network`)}>
              Add from Network
              <Icon name="chevron-right" inline />
            </Link>
          )}
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
      onCancel={() => ui.set({ setupServicesNew: true, setupAdded: undefined })}
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
