import React from 'react'
import reactStringReplace from 'react-string-replace'
import { makeStyles } from '@mui/styles'

export interface Props {
  name?: string
  port?: number
  color?: string
}

export const ConnectionName: React.FC<Props> = ({ name = 'Unknown', port, color }) => {
  const css = useStyles({ color })
  return (
    <div className={css.text}>
      <span>
        {reactStringReplace(name, '-', (match, i) => (
          <span key={i}>{match}</span>
        ))}
      </span>
      {port ? <cite className={css.port}>:{port}</cite> : ''}
    </div>
  )
}

export const useStyles = makeStyles(({ palette, spacing }) => ({
  text: ({ color }: any) => ({
    display: 'flex',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    color: palette[color]?.main,
    '& span ': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& span > span': {
      margin: 1,
      opacity: 0.5,
    },
  }),
  port: {
    fontWeight: 500,
    fontStyle: 'normal',
    marginLeft: 2,
    marginRight: spacing(2),
  },
}))
