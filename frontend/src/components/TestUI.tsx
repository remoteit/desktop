import React from 'react'
import { makeStyles } from '@mui/styles'
import { useSelector } from 'react-redux'
import { State } from '../store'

export const TestUI: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => {
  const { testUI } = useSelector((state: State) => state.ui)
  const css = useStyles()

  if (!testUI) return null

  if (testUI !== 'HIGHLIGHT') return children

  return (
    <div title="test ui feature" className={css.style} {...props}>
      {children}
    </div>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  style: { backgroundColor: palette.test.main },
}))
