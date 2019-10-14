import React from 'react'
import { ConnectionStateIcon } from '../ConnectionStateIcon'
import { DisconnectButtonController } from '../../controllers/DisconnectButtonController'
import { RestartButton } from '../RestartButton'
import { ForgetButton } from '../ForgetButton'
import { ConnectionErrorMessage } from '../ConnectionErrorMessage'
import { CopyButton } from '../CopyButton'
import { makeStyles } from '@material-ui/styles'
import styles from '../../styling'

export interface ConnectedServiceItemProps {
  connection: ConnectionInfo
}

export function ConnectedServiceItem({ connection }: ConnectedServiceItemProps) {
  const css = useStyles()

  if (!connection) return <p>No connection...</p>

  let state: ConnectionState = 'disconnected'
  if (connection.pid) state = 'connected'
  // TODO: show loading state when connection is establishing
  if (connection.connecting) state = 'connecting'

  return (
    <div className={css.container}>
      <div className={css.connection}>
        <ConnectionStateIcon className={css.stateIcon} state={state} size="lg" />
        <div className={css.title}>
          <div>{connection.name}</div>
          {connection.type && connection.name.toLowerCase() !== connection.type.toLowerCase() && (
            <span>{connection.type}</span>
          )}
          {connection.port && <span>localhost:{connection.port}</span>}
        </div>
        <div>
          {connection.port && <CopyButton title="Copy connection URL" text={`localhost:${connection.port}`} />}
          {connection.connecting || connection.pid ? (
            <DisconnectButtonController id={connection.id} />
          ) : (
            <ForgetButton id={connection.id} />
          )}
          {!connection.pid && <RestartButton id={connection.id} disabled={connection.connecting} />}
        </div>
      </div>
      {connection.error && <ConnectionErrorMessage connection={connection} />}
    </div>
  )
}

const useStyles = makeStyles({
  container: {
    padding: `${styles.spacing.sm}px ${styles.spacing.md}px`,
    backgroundColor: styles.colors.white,
    borderBottom: `1px solid ${styles.colors.grayLighter}`,
  },
  connection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateIcon: {
    marginRight: styles.spacing.md,
    textAlign: 'center',
  },
  title: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexGrow: 1,
    '&': {
      fontSize: styles.fontSizes.md,
      lineHeight: '20px',
    },
    '& span': {
      fontSize: styles.fontSizes.sm,
      color: styles.colors.gray,
      paddingRight: styles.spacing.md,
    },
  },
})
