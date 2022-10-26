import React from 'react'
import { getDeviceModel } from '../../models/accounts'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { Box, Button } from '@mui/material'
import { spacing } from '../../styling'

export const LoadMore: React.FC = () => {
  const { from, size, total, results, searched, fetching } = useSelector((state: ApplicationState) =>
    getDeviceModel(state)
  )
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  const pages = Math.ceil((searched ? results : total) / size)
  const nextPage = Math.floor(from / size) + 1

  if (nextPage >= pages) return null

  return (
    <Box className={css.box}>
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
    </Box>
  )
}

const useStyles = makeStyles({
  box: {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    height: 100,
    marginLeft: spacing.xl,
    marginTop: spacing.xl,
  },
})
