import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { DEFAULT_TARGET } from '../../constants'
import { makeStyles } from '@material-ui/styles'
import { Button, Link } from '@material-ui/core'
import { Icon } from '../Icon'
import { Target } from '../Target'
import styles from '../../styling'

type Props = {
  count: number
  added?: ITarget
  device: IDevice
  cliError?: string
  onSave: (target: ITarget) => void
  onCancel: () => void
}

export const NewTarget: React.FC<Props> = ({ added, count, onCancel, ...props }) => {
  const history = useHistory()
  const { ui } = useDispatch<Dispatch>()
  const { setupServicesCount, setupServicesNew } = useSelector((state: ApplicationState) => state.ui)
  const css = useStyles()

  useEffect(() => {
    ui.set({ setupServicesCount: count })
  }, [])

  useEffect(() => {
    if (count > setupServicesCount) {
      ui.set({ setupServicesNew: true, setupServicesCount: count })
    } else if (!!added) {
      ui.set({ setupServicesNew: false })
    }
  }, [setupServicesCount, count, added])

  if (setupServicesNew)
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
      data={added || DEFAULT_TARGET}
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
