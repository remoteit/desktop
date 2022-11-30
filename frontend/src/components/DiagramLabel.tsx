import React, { useContext } from 'react'
import { Typography, Box } from '@mui/material'
import { DiagramContext } from '../services/Context'

export type DiagramGroupType = 'target' | 'initiator' | 'tunnel' | 'forward' | 'proxy' | 'lan'

type Props = {
  name: string
  right?: boolean
}

export const DiagramLabel: React.FC<Props> = ({ name, right }) => {
  const { state } = useContext(DiagramContext)

  let titleColor: string | undefined = undefined

  switch (state) {
    case 'connected':
      titleColor = 'primary.main'
      break
  }

  return (
    <Box
      sx={{
        width: 0,
        position: 'relative',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          top: '-38px',
          right: right ? 0 : undefined,
          position: 'absolute',
          color: titleColor,
        }}
      >
        {name}
      </Typography>
    </Box>
  )
}
