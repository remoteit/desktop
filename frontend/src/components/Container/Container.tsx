import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { Body } from '../Body'

export const Container: React.FC<{ header: any }> = ({ header, children }) => {
  const css = useStyles()

  return (
    <div className={css.container}>
      <div>{header}</div>
      <Body>{children}</Body>
    </div>
  )
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'stretch',
    flexFlow: 'column',
    height: '100%',
  },
})
