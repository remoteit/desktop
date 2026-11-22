import React, { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Box, List, Typography } from '@mui/material'
import { Title } from './Title'

type Props = {
  id: string
  title: React.ReactNode
  action?: React.ReactNode
  list?: boolean // its rows are list items: wrapped in one list
  children?: React.ReactNode
}

export const DeviceSection: React.FC<Props> = ({ id, title, action, list = true, children }) => {
  const { section } = useParams<{ section?: string }>()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (section === id) ref.current?.scrollIntoView({ block: 'start' })
  }, [section, id])

  return (
    <Box ref={ref} component="section" data-device-section={id} sx={{ scrollMarginTop: 8 }}>
      <Typography variant="subtitle1" component="h2">
        <Title>{title}</Title>
        {action}
      </Typography>
      {list ? <List disablePadding>{children}</List> : children}
    </Box>
  )
}
