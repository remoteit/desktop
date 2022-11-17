import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'

export const TestUI: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const { testUI } = useSelector((state: ApplicationState) => state.ui)
  const css = useStyles()

  if (!testUI || testUI === 'OFF') return null

  return (
    <div title="test ui feature" className={testUI === 'HIGHLIGHT' ? css.style : undefined} {...props}>
      {children}
    </div>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  style: { backgroundColor: palette.test.main },
}))
