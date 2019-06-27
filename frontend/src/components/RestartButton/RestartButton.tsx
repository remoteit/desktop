import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'

export type RestartButtonProps = {
  serviceID: string
} & ReturnType<typeof mapDispatch>

const mapDispatch = (dispatch: any) => ({
  restart: dispatch.devices.restart,
})

export const RestartButton = connect(
  null,
  mapDispatch
)(({ restart, serviceID }: RestartButtonProps) => {
  return (
    <Tooltip title="Restart">
      <IconButton
        color="primary"
        className="txt-md"
        onClick={() => restart(serviceID)}
      >
        <Icon name="redo" fixedWidth />
      </IconButton>
    </Tooltip>
  )
})
