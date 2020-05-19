import React from 'react'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { spacing } from '../../styling'
import { makeStyles, Box, Button, CircularProgress, Typography } from '@material-ui/core'

export const LoadMore: React.FC = () => {
  const { from, size, total, results, searched, fetching } = useSelector((state: ApplicationState) => state.devices)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  const pages = Math.ceil((searched ? results : total) / size)
  const nextPage = Math.floor(from / size) + 1

  console.log('LOAD MORE', nextPage, pages)

  if (nextPage >= pages) return null

  return (
    <Box className={css.box}>
      {fetching ? (
        <CircularProgress />
      ) : (
        <>
          <Typography className={css.count} variant="caption">
            {from + size} loaded
          </Typography>
          <Button
            color="primary"
            onClick={() => {
              dispatch.devices.set({ from: nextPage * size, append: true })
              dispatch.devices.fetch()
            }}
          >
            Load More ...
          </Button>
        </>
      )}
    </Box>
  )
}

const useStyles = makeStyles({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    height: 100,
  },
  count: {
    position: 'absolute',
    left: 77,
  },
})
