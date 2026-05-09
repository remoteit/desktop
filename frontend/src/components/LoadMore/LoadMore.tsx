import React from 'react'
import { Box, Button, Typography } from '@mui/material'

type Props = {
  from: number
  size: number
  count: number
  fetching: boolean
  onLoadMore: () => void
}

export const LoadMore: React.FC<Props> = ({ from, size, count, fetching, onLoadMore }) => {
  const pages = Math.ceil(count / size)
  const nextPage = Math.floor(from / size) + 1
  const showing = Math.min(from + size, count)

  if (nextPage >= pages) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        padding: 3,
        paddingBottom: 4.5,
        height: 100,
        marginLeft: 4.5,
        marginTop: 4.5,
        gap: 4,
      }}
    >
      <Button color="primary" disabled={fetching} onClick={onLoadMore}>
        {fetching ? `Loading ${from} - ${from + size}...` : 'Load More'}
      </Button>
      <Typography variant="subtitle2" color="GrayText">
        {showing.toLocaleString()} of {count.toLocaleString()}
      </Typography>
    </Box>
  )
}
