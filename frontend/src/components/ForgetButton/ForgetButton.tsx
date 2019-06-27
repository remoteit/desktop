import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'

export type ForgetButtonProps = {
  serviceID: string
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  forget: dispatch.devices.forget,
})

export const ForgetButton = connect(
  null,
  mapDispatch
)(({ forget, serviceID }: ForgetButtonProps) => {
  return (
    <Tooltip title="Forget this connection">
      <IconButton
        color="secondary"
        className="txt-md"
        onClick={() => forget(serviceID)}
      >
        <Icon name="times" fixedWidth />
      </IconButton>
    </Tooltip>
  )
})
