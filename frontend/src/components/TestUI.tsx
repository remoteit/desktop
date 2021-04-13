import React from 'react'
import { makeStyles } from '@material-ui/core'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../store'
import { colors, spacing } from '../styling'

export const TestUI: React.FC = ({ children, ...props }) => {
  const { testUI } = useSelector((state: ApplicationState) => state.backend.preferences)
  const css = useStyles()

  if (!testUI) return null

  return (
    <div title="test ui feature" className={css.style} {...props}>
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  style: { backgroundColor: colors.test },
})
