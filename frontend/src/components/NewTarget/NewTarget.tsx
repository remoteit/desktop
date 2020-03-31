import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
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
  const [showNew, setShowNew] = useState<boolean>(!added)
  const [lastCount, setLastCount] = useState<number>(count)
  const css = useStyles()

  useEffect(() => {
    if (count > lastCount) {
      setShowNew(true)
      setLastCount(count)
    } else if (!!added) {
      setShowNew(false)
    }
  }, [lastCount, count, added])

  if (showNew)
    return (
      <tr>
        <td colSpan={6} className={css.button}>
          <Button color="primary" variant="contained" onClick={() => setShowNew(false)}>
            Add
            <Icon name="plus" inline />
          </Button>
          <span className={css.or}>or</span>
          <Link onClick={() => history.push('/settings/setup/network')}>Scan for services</Link>
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
        setShowNew(true)
        onCancel()
      }}
      onDelete={() => {}}
    />
  )
}

const useStyles = makeStyles({
  button: {
    paddingTop: styles.spacing.lg,
    color: styles.colors.gray,
  },
  or: { paddingLeft: styles.spacing.md },
})
