import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@material-ui/core'

export const NewConnectionButton: React.FC = () => {
  return (
    <Link to="/connections/new">
      <Button variant="contained" color="primary" size="large" fullWidth>
        New Connection
      </Button>
    </Link>
  )
}
