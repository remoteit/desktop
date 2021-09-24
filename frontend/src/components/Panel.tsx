import React from 'react'
import { makeStyles } from '@material-ui/core'
import { Header } from './Header'

export const Panel: React.FC = ({ children }) => {
  const css = useStyles()

  return (
    <div className={css.panel}>
      <Header />
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
