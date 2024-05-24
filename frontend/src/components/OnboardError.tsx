import React from 'react'
import { Collapse } from '@mui/material'
import { Notice } from './Notice' // Assuming you have a Notice component

interface Props {
  error: string
}

export const OnboardError: React.FC<Props> = ({ error }) => {
  const [cache, setCache] = React.useState(error)

  React.useEffect(() => {
    if (error) setCache(error)
  }, [error])

  return (
    <Collapse in={!!error} timeout={600}>
      <Notice severity="error" fullWidth gutterTop>
        {cache}
      </Notice>
    </Collapse>
  )
}
