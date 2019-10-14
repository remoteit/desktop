import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import { Icon } from '../Icon'
import { connect } from 'react-redux'

const mapDispatch = (dispatch: any) => ({
  restart: dispatch.devices.restart,
})

export type RestartButtonProps = {
  id: string
  connected?: boolean
  disabled?: boolean
} & ReturnType<typeof mapDispatch>

export const RestartButton = connect(
  null,
  mapDispatch
)(({ connected, disabled = false, restart, id }: RestartButtonProps) => {
  return (
    <Tooltip title="Connect">
      <IconButton disabled={disabled} onClick={() => restart(id)}>
        <Icon name={connected ? 'redo' : 'arrow-right'} color="primary" size="md" weight="regular" fixedWidth />
      </IconButton>
    </Tooltip>
  )
})
