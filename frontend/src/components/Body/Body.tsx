import React from 'react'
import styles from '../../styling'
import { makeStyles } from '@material-ui/styles'

export const Body: React.FC<{ show?: boolean; inset?: boolean }> = ({ show, inset, children }) => {
  const css = useStyles()
  return (
    <div style={{ display: show ? 'block' : 'none' }} className={css.content + (inset ? ' ' + css.inset : '')}>
      {children}
    </div>
  )
}

const useStyles = makeStyles({
  content: {
    overflowY: 'auto',
    flexGrow: 1,
    position: 'relative',
    '-webkit-overflow-scrolling': 'touch',
    '&::-webkit-scrollbar': { display: 'none' },
    '& section': {
      display: 'flex',
      justifyContent: 'space-between',
      padding: `${styles.spacing.xl}px 0`,
    },
    '& h2': {
      textTransform: 'uppercase',
      fontSize: 12,
      letterSpacing: '0.6em',
      fontWeight: 500,
      color: styles.colors.gray,
      marginTop: styles.spacing.lg,
      borderBottom: `1px solid ${styles.colors.grayLighter}`,
      paddingBottom: styles.spacing.sm,
    },
  },
  inset: {
    padding: `${styles.spacing.sm}px ${styles.spacing.xl}px`,
  },
})
