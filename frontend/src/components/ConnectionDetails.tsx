import React from 'react'
import { makeStyles, Collapse, Paper } from '@material-ui/core'
import { getAttributes } from '../helpers/attributes'
import { LaunchButton } from '../buttons/LaunchButton'
import { CopyButton } from '../buttons/CopyButton'
import { DataDisplay } from './DataDisplay'
import { GuideStep } from './GuideStep'
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
        <GuideStep
          guide="guideAWS"
          step={6}
          instructions="You can now use this address in your application and it will auto-connect on demand."
          placement="left"
          highlight
          autoNext
        >
          <CopyButton connection={connection} service={service} dataButton />
        </GuideStep>
        <GuideStep
          guide="guideAWS"
          step={7}
          instructions="Or for web and some other services you can use the launch button."
          placement="left"
          highlight
          autoNext
          last
        >
          <LaunchButton connection={connection} service={service} dataButton />
        </GuideStep>
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
