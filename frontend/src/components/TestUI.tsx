import React from 'react'
import { makeStyles } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { colors } from '../styling'

export const TestUI: React.FC = ({ children, ...props }) => {
  const { testUI } = useSelector((state: ApplicationState) => state.backend.preferences)
  const css = useStyles()

  if (!testUI || testUI === 'OFF') return null

  return (
    <div title="test ui feature" className={testUI === 'HIGHLIGHT' ? css.style : undefined} {...props}>
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  style: { backgroundColor: colors.test },
})
