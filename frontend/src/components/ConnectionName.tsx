import React from 'react'
import reactStringReplace from 'react-string-replace'
import { Box } from '@mui/material'

export interface Props {
  name?: string
  port?: number
  color?: string
}

export const ConnectionName: React.FC<Props> = ({ name = 'Unknown', port, color }) => {
  return (
    <Box
      sx={theme => ({
        display: 'flex',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        color: color ? (theme.palette as any)[color]?.main : undefined,
        '& span ': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        '& span > span': {
          margin: '1px',
          opacity: 0.5,
        },
      })}
    >
      <span>
        {reactStringReplace(name, '-', (match, i) => (
          <span key={i}>{match}</span>
        ))}
      </span>
      {port ? (
        <Box component="cite" sx={{ fontWeight: 500, fontStyle: 'normal', marginLeft: '2px', marginRight: '16px' }}>
          :{port}
        </Box>
      ) : (
        ''
      )}
    </Box>
  )
}
