import React from 'react'
import browser from '../services/Browser'
import { Box } from '@mui/material'

export const Pre: React.FC<ILookup<any>> = props => {
  // console.log('PRE OUTPUT', props)
  const output = (
    <>
      {Object.keys(props).map(key => (
        <pre key={key} style={{ maxHeight: '50vh', overflow: 'scroll', opacity: 0.5 }}>
          {key}: {`\n${JSON.stringify(props[key], null, 2)}\n\n`}
        </pre>
      ))}
    </>
  )

  return browser.isMobile ? (
    <Box
      sx={{
        position: 'absolute',
        bgcolor: 'magenta',
        bottom: 0,
        left: 0,
        right: 0,
        paddingX: 1.5,
        '& pre': {
          color: 'white',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
        },
      }}
    >
      {output}
    </Box>
  ) : (
    output
  )
}
