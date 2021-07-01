import React from 'react'
import { makeStyles, Collapse, Paper } from '@material-ui/core'
import { getAttributes } from '../helpers/attributes'
import { LaunchButton } from '../buttons/LaunchButton'
import { CopyButton } from '../buttons/CopyButton'
import { DataDisplay } from './DataDisplay'
import { Gutters } from './Gutters'
import { colors, spacing } from '../styling'

type Props = {
  connection?: IConnection
  service?: IService
  session?: ISession
  show?: boolean
}

export const ConnectionDetails: React.FC<Props> = ({ show, connection, service, session }) => {
  const attributes = getAttributes(['connection', 'duration', 'location', 'initiatorPlatform'])
  const css = useStyles()

  return (
    <Collapse in={show} timeout={800}>
      <Paper className={css.paper} elevation={0}>
        <LaunchButton connection={connection} service={service} dataButton />
        <CopyButton connection={connection} service={service} dataButton />
        <Gutters inset noBottom noTop>
          <DataDisplay attributes={attributes} connection={connection} session={session} width={100} />
        </Gutters>
      </Paper>
    </Collapse>
  )
}

const useStyles = makeStyles({
  paper: {
    backgroundColor: colors.primaryHighlight,
    padding: spacing.xs,
  },
})
