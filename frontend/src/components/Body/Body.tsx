import React from 'react'
import styles from '../../styling'
import { makeStyles } from '@material-ui/styles'

export const Body: React.FC<{ inset?: boolean }> = ({ inset, children }) => {
  const css = useStyles()
  return <div className={css.content + (inset ? ' ' + css.inset : '')}>{children}</div>
}

const useStyles = makeStyles({
  content: {
    overflowY: 'auto',
    flexGrow: 1,
    position: 'relative',
    '-webkit-overflow-scrolling': 'touch',
    '&::-webkit-scrollbar': { display: 'none' },
    '& section': {
      padding: `${styles.spacing.xl}px`,
    },
  },
  inset: {
    padding: `${styles.spacing.sm}px ${styles.spacing.xl}px`,
  },
})
