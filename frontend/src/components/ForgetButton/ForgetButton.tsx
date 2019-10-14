import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'

const mapDispatch = (dispatch: any) => ({
  forget: dispatch.devices.forget,
})

export type ForgetButtonProps = {
  id: string
  disabled?: boolean
} & ReturnType<typeof mapDispatch>

export const ForgetButton = connect(
  null,
  mapDispatch
)(({ disabled = false, forget, id }: ForgetButtonProps) => {
  return (
    <Tooltip title="Forget this connection">
      <IconButton disabled={disabled} onClick={() => forget(id)}>
        <Icon name="trash-alt" color="gray" size="md" fixedWidth />
      </IconButton>
    </Tooltip>
  )
})
