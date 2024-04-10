import React from 'react'
import { Gutters, GuttersProps } from './Gutters'
import { useMediaQuery } from '@mui/material'
import { makeStyles } from '@mui/styles'

export const PlanGutters: React.FC<GuttersProps> = ({ children, ...props }) => {
  const small = useMediaQuery(`(max-width:600px)`)
  const css = useStyles({ small })

  return (
    <Gutters size="lg" className={css.plans} {...props}>
      {children}
    </Gutters>
  )
}

const useStyles = makeStyles({
  plans: ({ small }: { small: boolean }) => ({
    display: 'flex',
    justifyContent: 'center',
    flexWrap: small ? 'wrap' : 'nowrap',
    marginBottom: 0,
    marginTop: 0,
    maxWidth: 840,
  }),
})
