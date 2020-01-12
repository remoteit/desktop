import React from 'react'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { makeStyles } from '@material-ui/styles'
import { Snackbar } from '@material-ui/core'
import { UpdateNotice } from '../../components/UpdateNotice'
import styles from '../../styling'

export interface Props {
  children: React.ReactNode
  authenticated?: boolean
}

export function Page({ authenticated = true, children }: Props & React.HTMLProps<HTMLDivElement>) {
  const { connected } = useSelector((state: ApplicationState) => state.ui)
  const css = useStyles()

  return (
    <div className={css.page}>
      {children}
      <Snackbar open={authenticated && !connected} message="Webserver connection lost. Retrying..." />
      <UpdateNotice />
    </div>
  )
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
