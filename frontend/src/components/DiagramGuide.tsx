import React, { useContext } from 'react'
import { Typography } from '@mui/material'
import { DiagramContext } from '../services/Context'
import { GuideBubble } from './GuideBubble'

type Props = {
  type: DiagramGroupType
  children: React.ReactNode
}

export const DiagramGuide: React.FC<Props> = ({ type, children }) => {
  const { toTypes } = useContext(DiagramContext)
  const to = toTypes?.[type] || ''

  return (
    <GuideBubble
      highlight
      guide="viewSetup"
      enterDelay={100}
      placement="bottom"
      hide={!to}
      sx={{ maxWidth: '100px' }}
      instructions={
        <>
          <Typography variant="h3" gutterBottom>
            <b>Click for target setup</b>
          </Typography>
          <Typography variant="body2" gutterBottom>
            Change and view service configuration and details.
          </Typography>
        </>
      }
    >
      {children}
    </GuideBubble>
  )
}
