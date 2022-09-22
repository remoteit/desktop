import React from 'react'
import reactStringReplace from 'react-string-replace'
import { makeStyles } from '@mui/styles'

export interface Props {
  name?: string
  port?: number
  enabled?: boolean
}

export const ConnectionName: React.FC<Props> = ({ name = 'Unknown', port, enabled }) => {
  const css = useStyles({ enabled })
  return (
    <span className={css.text}>
      {reactStringReplace(name, '-', (match, i) => (
        <span key={i}>{match}</span>
      ))}
      {port ? <span>:{port}</span> : ''}
    </span>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  text: ({ enabled }: any) => ({
    fontWeight: 400,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: enabled ? palette.primary.main : palette.grayDarkest.main,
    whiteSpace: 'nowrap',
    '& span': {
      margin: 1,
      opacity: 0.5,
    },
  }),
}))
