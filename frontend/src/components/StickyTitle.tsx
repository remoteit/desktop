import React from 'react'
import { ListSubheader } from '@mui/material'
import { LinearProgress } from './LinearProgress'

type Props = { loading?: boolean; children?: React.ReactNode }

export const StickyTitle: React.FC<Props> = ({ loading, children }) => {
  return (
    <ListSubheader
      sx={theme => ({
        display: 'flex',
        paddingTop: 3,
        paddingBottom: 1,
        borderBottom: `1px solid ${theme.palette.grayLighter.main}`,

        '&::after': {
          top: 0,
          content: '""',
          position: 'absolute',
          height: '100%',
          width: '30px',
          left: '-30px',
          backgroundColor: theme.palette.white.main,
        },
      })}
    >
      <LinearProgress loading={loading} />
      {children}
    </ListSubheader>
  )
}
