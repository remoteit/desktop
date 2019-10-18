import React from 'react'
import styles from '../../styling'
import { makeStyles } from '@material-ui/styles'

export interface Props {
  children: React.ReactNode
}

export function Page({ children }: Props & React.HTMLProps<HTMLDivElement>) {
  const css = useStyles()
  return <div className={css.page}>{children}</div>
}

const useStyles = makeStyles({
  page: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    backgroundColor: styles.colors.white,
  },
})
