import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'

export type ForgetButtonProps = {
  id: string
  disabled?: boolean
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  forget: dispatch.devices.forget,
})

export const ForgetButton = connect(
  null,
  mapDispatch
)(({ disabled = false, forget, id }: ForgetButtonProps) => {
  return (
    <Tooltip title="Forget this connection">
      <IconButton
        color="secondary"
        className="txt-md"
        disabled={disabled}
        onClick={() => forget(id)}
      >
        <Icon name="times" fixedWidth />
      </IconButton>
    </Tooltip>
  )
})
