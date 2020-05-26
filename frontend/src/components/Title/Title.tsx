import React from 'react'
import { makeStyles } from '@material-ui/core'

export const Title: React.FC<{ primary: string }> = ({ primary }) => {
  const css = useStyles()
  return <span className={css.title}>{primary}</span>
}

const useStyles = makeStyles({
  title: { flexGrow: 1 },
})
