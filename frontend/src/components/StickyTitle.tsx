import React from 'react'
import { makeStyles } from '@mui/styles'
import { ListSubheader } from '@mui/material'
import { LinearProgress } from './LinearProgress'

type Props = { loading?: boolean; children?: React.ReactNode }

export const StickyTitle: React.FC<Props> = ({ loading, children }) => {
  const css = useStyles()
  return (
    <ListSubheader className={css.title}>
      <LinearProgress loading={loading} />
      {children}
    </ListSubheader>
  )
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  title: {
    display: 'flex',
    paddingTop: spacing(3),
    paddingBottom: spacing(1),
    borderBottom: `1px solid ${palette.grayLighter.main}`,

    '&::after': {
      top: 0,
      content: '""',
      position: 'absolute',
      height: '100%',
      width: 30,
      left: -30,
      backgroundColor: palette.white.main,
    },
  },
}))
