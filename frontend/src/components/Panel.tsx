import React from 'react'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'

export const Panel: React.FC<{ singlePanel?: boolean }> = ({ singlePanel, children }) => {
  const css = useStyles()

  return (
    <div className={css.panel}>
      <Header singlePanel={singlePanel} />
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  panel: {
    flexGrow: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
})
