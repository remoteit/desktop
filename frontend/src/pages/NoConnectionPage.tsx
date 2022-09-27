import React from 'react'
import { Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { EmptyMessage } from '../components/EmptyMessage'

export const NoConnectionPage: React.FC = () => {
  const css = useStyles()
  return (
    <Box className={css.container}>
      <EmptyMessage
        message={
          <>
            Select an <br />
            item on the left <br />
            to view its details.
          </>
        }
      />
    </Box>
  )
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '5vw',
  },
})
