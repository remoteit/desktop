import React from 'react'
import Typography from '@material-ui/core/Typography'
import { useTitle } from 'hookrouter'

export function NotFoundPage() {
  useTitle('Page Not Found')

  return (
    <>
      <Typography component="h2" variant="h1" gutterBottom>
        Page Not Found
      </Typography>
    </>
  )
}
