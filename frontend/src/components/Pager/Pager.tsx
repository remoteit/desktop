import React from 'react'
import { Dispatch, ApplicationState } from '../../store'
import { useDispatch, useSelector } from 'react-redux'
import { spacing, colors } from '../../styling'
import { Box, Slider, Typography } from '@material-ui/core'
import { makeStyles, withStyles } from '@material-ui/core/styles'
import Pagination from '@material-ui/lab/Pagination'

export const Pager: React.FC = () => {
  const { from, size, total, results, searched } = useSelector((state: ApplicationState) => state.devices)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  const pages = Math.ceil((searched ? results : total) / size)
  const currentPage = Math.floor(from / size) + 1
  // const marks = [...new Array(pages)].map((_, i) => ({ value: i + 1, label: i + 1 }))

  if (pages < 2) return null

  return (
    <Box className={css.box}>
      {/* <Typography variant="caption" color="textPrimary">
        Page
      </Typography> */}
      <Pagination
        count={pages}
        page={currentPage}
        siblingCount={4}
        onChange={(_, page) => {
          dispatch.devices.set({ from: (+page - 1) * size })
          dispatch.devices.fetch()
        }}
        // renderItem={params => <div {...params}></div>}
      />
      {/* <PageSlider
        className={css.slider}
        defaultValue={currentPage}
        onChangeCommitted={(_, page) => {
          dispatch.devices.set({ from: (+page - 1) * size })
          dispatch.devices.fetch()
        }}
        valueLabelDisplay="auto"
        step={1}
        marks={true}
        min={1}
        max={pages}
      /> */}
    </Box>
  )
}

const useStyles = makeStyles({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    // paddingTop: spacing.lg,
    // paddingRight: spacing.xl,
    // paddingBottom: spacing.lg,
    // paddingLeft: spacing.md,
    // '& > *': { margin: spacing.sm },
  },
  slider: {},
})

const PageSlider = withStyles({
  root: { color: colors.grayDark },
  rail: { backgroundColor: colors.grayLight },
  mark: { backgroundColor: colors.gray },
  markActive: { backgroundColor: colors.grayLighter },
})(Slider)
