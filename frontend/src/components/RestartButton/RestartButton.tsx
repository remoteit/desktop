import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'

export type RestartButtonProps = {
  id: string
  disabled?: boolean
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  restart: dispatch.devices.restart,
})

export const RestartButton = connect(
  null,
  mapDispatch
)(({ disabled = false, restart, id }: RestartButtonProps) => {
  return (
    <Tooltip title="Restart">
      <IconButton
        color="primary"
        className="txt-md"
        disabled={disabled}
        onClick={() => restart(id)}
      >
        <Icon name="redo" fixedWidth />
      </IconButton>
    </Tooltip>
  )
})
