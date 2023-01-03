import React, { useContext } from 'react'
import { Typography, Box } from '@mui/material'
import { DiagramContext } from '../services/Context'

type Props = {
  type?: DiagramGroupType
  right?: boolean
}

export const DiagramLabel: React.FC<Props> = ({ type, right }) => {
  const { state, highlightTypes } = useContext(DiagramContext)
  const highlight = type ? highlightTypes.includes(type) : false

  let titleColor: string | undefined = undefined
  let name: string = ''

  switch (type) {
    case 'lan':
      name = 'LAN'
      break
    case 'proxy':
      name = 'Cloud'
      break
    case 'public':
      name = 'Public'
      break
    case 'tunnel':
      name = 'Tunnel'
      break
    case 'initiator':
      name = 'Local'
      break
    case 'relay':
      name = 'Jump'
      break
    case 'target':
      name = 'Service'
      break
  }

  switch (state) {
    case 'connected':
      titleColor = 'primary.main'
      break
  }

  if (highlight) titleColor = 'black.main'

  return (
    <Box
      sx={{
        width: 0,
        position: 'relative',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          top: '-32px',
          right: right ? 0 : undefined,
          position: 'absolute',
          maxWidth: 'initial',
          color: titleColor,
        }}
      >
        {name}
      </Typography>
    </Box>
  )
}
