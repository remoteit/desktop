import React from 'react'
import { makeStyles } from '@material-ui/core/styles'
import { Body } from '../Body'

export const Container: React.FC<{ header: any; inset?: boolean }> = ({ header, inset, children }) => {
  const css = useStyles()

  return (
    <div className={css.container}>
      <div>{header}</div>
      <Body inset={inset}>{children}</Body>
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
