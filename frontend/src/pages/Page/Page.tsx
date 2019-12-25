import React, { useState, useEffect } from 'react'
import Controller from '../../services/Controller'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { makeStyles } from '@material-ui/styles'
import { Snackbar, Button, IconButton } from '@material-ui/core'
import { version } from '../../../package.json'
import { Icon } from '../../components/Icon'
import styles from '../../styling'

export interface Props {
  children: React.ReactNode
  authenticated?: boolean
}

export function Page({ authenticated = true, children }: Props & React.HTMLProps<HTMLDivElement>) {
  const [updateNotice, setUpdateNotice] = useState<boolean>(false)
  const { connected, update } = useSelector((state: ApplicationState) => ({
    connected: state.ui.connected,
    update: state.backend.update,
  }))
  const css = useStyles()

  useEffect(() => {
    if (update && update !== version) setUpdateNotice(true)
  }, [update])

  return (
    <div className={css.page}>
      {children}
      <Snackbar open={authenticated && !connected} message="Webserver connection lost. Retrying..." />
      <Snackbar
        open={updateNotice}
        message={`An update is available (v${update}).`}
        action={[
          <Button color="secondary" size="small" onClick={() => Controller.emit('restart')}>
            Restart
          </Button>,
          <IconButton onClick={() => setUpdateNotice(false)}>
            <Icon name="times" size="md" fixedWidth />
          </IconButton>,
        ]}
      />
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
