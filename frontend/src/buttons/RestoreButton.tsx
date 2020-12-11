import React from 'react'
import { emit } from '../services/Controller'
import { Button } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'

export const RestoreButton: React.FC<{ device: IDevice; onClick?: () => void }> = ({ device, onClick }) => {
  const { ui } = useDispatch<Dispatch>()

  return (
    <Button
      onClick={() => {
        ui.set({ restoring: true, restore: false })
        emit('restore', device.id)
      }}
      color="primary"
      variant="contained"
      size="small"
    >
      Restore
    </Button>
  )
}
