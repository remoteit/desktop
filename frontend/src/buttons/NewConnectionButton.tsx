import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'

export const NewConnectionButton: React.FC = () => {
  return (
    <Button to="/connections/new" variant="contained" color="primary" size="large" component={Link} fullWidth>
      New Connection
    </Button>
  )
}
