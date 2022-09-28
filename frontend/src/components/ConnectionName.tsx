import React from 'react'
import reactStringReplace from 'react-string-replace'
import { makeStyles } from '@mui/styles'

export interface Props {
  name?: string
  port?: number
}

export const ConnectionName: React.FC<Props> = ({ name = 'Unknown', port }) => {
  const css = useStyles()
  return (
    <span className={css.text}>
      {reactStringReplace(name, '-', (match, i) => (
        <span key={i}>{match}</span>
      ))}
      {port ? <span>:{port}</span> : ''}
    </span>
  )
}

export const useStyles = makeStyles({
  text: {
    '& span': {
      margin: 1,
      opacity: 0.5,
    },
  },
})
