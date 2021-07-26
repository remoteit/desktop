import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'
import { ApplicationState } from '../store'
import { useSelector } from 'react-redux'
import { isRemoteUI } from '../helpers/uiHelper'

export const NewConnectionButton: React.FC = () => {
  const remoteUI = useSelector((state: ApplicationState) => isRemoteUI(state))

  if (remoteUI) return null

  return (
    <Button to="/connections/new" variant="contained" color="primary" size="large" component={Link} fullWidth>
      New Connection
    </Button>
  )
}
