import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Icon } from '../components/Icon'

type Props = {
  tooltip?: string
  icon?: string
  disabled?: boolean
  label?: string
  onTransfer: () => void
}

export const TransferButton: React.FC<Props> = ({
  tooltip = 'transfer this device',
  icon = 'share',
  disabled,
  label,
  onTransfer
}) => {
  const css = useStyles()

  return (
    <>
      <Tooltip title={tooltip}>
        <span>
          <IconButton disabled={disabled} onClick={onTransfer}>
            <Icon name={icon} size="md" fixedWidth />
            {label && (<span className={css.label}> {label} </span>)}
          </IconButton>
        </span>
      </Tooltip>
    </>
  )
}

const useStyles = makeStyles({
  label: {
    fontSize: '1rem',
    marginLeft: 15,
    marginTop: 5,
    minWidth: 150,
    textAlign: 'left'
  }
})
