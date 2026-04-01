import React from 'react'
import { Dispatch, State } from '../../store'
import { selectDeviceModelAttributes } from '../../selectors/devices'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Button, Typography } from '@mui/material'

export const LoadMore: React.FC = () => {
  const { from, size, total, results, searched, fetching } = useSelector((state: State) =>
    selectDeviceModelAttributes(state)
  )
  const dispatch = useDispatch<Dispatch>()

  const pages = Math.ceil((searched ? results : total) / size)
  const nextPage = Math.floor(from / size) + 1

  const count = searched ? results : total
  const showing = Math.min(from + size, count)

  if (nextPage >= pages) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        display: 'flex',
        // justifyContent: 'space-between',
        alignItems: 'center',
        padding: 3,
        paddingBottom: 4.5,
        height: 100,
        marginLeft: 4.5,
        marginTop: 4.5,
        gap: 4,
      }}
    >
      <Button
        color="primary"
        disabled={fetching}
        onClick={() => {
          dispatch.devices.set({ from: nextPage * size, append: true })
          dispatch.devices.fetchList()
        }}
      >
        {fetching ? `Loading ${from} - ${from + size}...` : 'Load More'}
      </Button>
      <Typography variant="subtitle2" color="GrayText">
        {showing.toLocaleString()} of {count.toLocaleString()}
      </Typography>
    </Box>
  )
}
