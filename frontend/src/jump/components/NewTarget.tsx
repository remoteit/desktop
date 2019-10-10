import React, { useEffect, useState } from 'react'
import { Button } from '@material-ui/core'
import { AddRounded } from '@material-ui/icons'
import { makeStyles } from '@material-ui/styles'
import Target from './Target'
import defaults from '../common/defaults'
import styles from '../../styling'

type Props = {
  count: number
  added?: ITarget
  device: IDevice
  onSave: (target: ITarget) => void
  onCancel: () => void
}

const NewTarget: React.FC<Props> = ({ added, count, onCancel, ...props }) => {
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
        <td colSpan={6}>
          <Button onClick={() => setShowNew(false)} className={css.button}>
            New
            <AddRounded />
          </Button>
        </td>
      </tr>
    )

  return (
    <Target
      {...props}
      init
      disable={false}
      data={added || defaults}
      onCancel={() => {
        setShowNew(true)
        onCancel()
      }}
      onDelete={() => {}}
    />
  )
}

export default NewTarget

const useStyles = makeStyles({
  button: { marginTop: styles.spacing.lg },
})
