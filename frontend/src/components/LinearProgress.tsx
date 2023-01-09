import React from 'react'
import { makeStyles } from '@mui/styles'
import { LinearProgress as MuiLinearProgress } from '@mui/material'

type Props = { loading?: boolean }

export const LinearProgress: React.FC<Props> = ({ loading }) => {
  const css = useStyles()
  return loading ? <MuiLinearProgress className={css.loading} /> : null
}

const useStyles = makeStyles({
  loading: {
    position: 'absolute',
    width: '100%',
    zIndex: 10,
    height: 2,
    bottom: 0,
    left: 0,
  },
})
