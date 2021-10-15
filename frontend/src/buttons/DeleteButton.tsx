import React, { useState } from 'react'
import { Tooltip, IconButton, CircularProgress } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Confirm } from '../components/Confirm'
import { Icon } from '../components/Icon'
import styles from '../styling'

type Props = {
  tooltip?: string
  warning?: string | React.ReactElement
  icon?: string
  disabled?: boolean
  destroying?: boolean
  onDelete: () => void
}

export const DeleteButton: React.FC<Props> = ({
  tooltip = 'delete',
  warning,
  icon = 'trash',
  disabled,
  destroying,
  onDelete,
}) => {
  const [open, setOpen] = useState<boolean>(false)
  const css = useStyles()

  if (destroying) return <CircularProgress className={css.loading} size={styles.fontSizes.md} />

  return (
    <>
      <Tooltip title={tooltip}>
        <span>
          <IconButton disabled={disabled} onClick={() => setOpen(true)}>
            <Icon name={icon} size="md" fixedWidth />
          </IconButton>
        </span>
      </Tooltip>
      <Confirm
        open={open}
        onConfirm={() => {
          setOpen(false)
          onDelete()
        }}
        onDeny={() => setOpen(false)}
        title="Are you sure?"
      >
        {warning}
      </Confirm>
    </>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
