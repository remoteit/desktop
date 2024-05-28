import React from 'react'
import { Collapse } from '@mui/material'
import { Notice } from './Notice' // Assuming you have a Notice component

interface Props {
  message: string
  severity?: 'info' | 'error' | 'warning' | 'success'
}

export const OnboardMessage: React.FC<Props> = ({ message, severity }) => {
  const [cache, setCache] = React.useState(message)

  React.useEffect(() => {
    if (message) setCache(message)
  }, [message])

  return (
    <Collapse in={!!message} timeout={600}>
      <Notice severity={severity} fullWidth gutterTop>
        {cache}
      </Notice>
    </Collapse>
  )
}
