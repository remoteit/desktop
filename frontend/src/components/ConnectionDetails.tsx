import React from 'react'
import { makeStyles, Typography, InputLabel, Collapse, Paper } from '@material-ui/core'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { getAttributes } from '../helpers/attributes'
import { LaunchButton } from '../buttons/LaunchButton'
import { useApplication } from '../hooks/useApplication'
import { CommandButton } from '../buttons/CommandButton'
import { CopyButton } from '../buttons/CopyButton'
import { DataDisplay } from './DataDisplay'
import { GuideStep } from './GuideStep'
import { Gutters } from './Gutters'
import { colors, spacing } from '../styling'

type Props = {
  connection?: IConnection
  service?: IService
  session?: ISession
  details?: boolean
  show?: boolean
}

export const ConnectionDetails: React.FC<Props> = ({ details, show, connection, service, session }) => {
  const attributes = getAttributes(['lanShare', 'connection', 'duration', 'location', 'initiatorPlatform'])
  const [hover, setHover] = React.useState<'name' | 'port' | undefined>()
  const app = useApplication('copy', service, connection)
  const { ui } = useDispatch<Dispatch>()
  const css = useStyles()

  if (!connection) return null

  const address = app.address.split(':')
  const name = address[0]
  const port = address[1]

  return (
    <Collapse in={show} timeout={800}>
      <Gutters bottom="xxs">
        <Paper className={css.address} elevation={0}>
          <Gutters size="md" bottom={null}>
            <InputLabel shrink>Address</InputLabel>
            <Typography variant="h2">
              {name && <span className={hover === 'name' ? css.active : css.text}>{name}</span>}
              {port && (
                <>
                  :<span className={hover === 'port' ? css.active : css.text}>{port}</span>
                </>
              )}
            </Typography>
          </Gutters>
          <Gutters size="md" top="sm" bottom="sm" className={css.buttons}>
            <span>
              {/* <InputLabel shrink>Copy</InputLabel> */}
              <GuideStep
                guide="guideAWS"
                step={6}
                instructions="Copy this address for use in your application to have it connect on demand."
                placement="left"
                highlight
              >
                <CommandButton
                  color="white"
                  type="solid"
                  title="Copy Command"
                  connection={connection}
                  service={service}
                  onCopy={() => ui.guide({ guide: 'guideAWS', step: 7 })}
                />
              </GuideStep>
              <CopyButton
                color="white"
                icon="i-cursor"
                type="solid"
                size="md"
                value={connection.host}
                title="Copy Name"
                onMouseEnter={() => setHover('name')}
                onMouseLeave={() => setHover(undefined)}
              />
              <CopyButton
                color="white"
                icon="port"
                type="solid"
                size="md"
                value={connection.port}
                title="Copy Port"
                onMouseEnter={() => setHover('port')}
                onMouseLeave={() => setHover(undefined)}
              />
            </span>
            <span>
              {/* <InputLabel shrink>Launch</InputLabel> */}
              <GuideStep
                guide="guideAWS"
                step={7}
                instructions="Or for web and some other services you can use the launch button."
                placement="left"
                highlight
              >
                <LaunchButton
                  color="white"
                  type="solid"
                  size="md"
                  connection={connection}
                  service={service}
                  onLaunch={() => ui.guide({ guide: 'guideAWS', step: 0, done: true })}
                />
              </GuideStep>
            </span>
          </Gutters>
        </Paper>
        {details && <DataDisplay attributes={attributes} connection={connection} session={session} width={100} />}
      </Gutters>
    </Collapse>
  )
}

const useStyles = makeStyles({
  active: {
    backgroundColor: colors.darken,
    borderRadius: 2,
  },
  text: {},
  address: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: spacing.xs,
    marginBottom: spacing.xs,
    '& label': { color: colors.white },
    '& h2': { fontWeight: 500, lineHeight: '1.33em' /* wordBreak: 'break-all' */ },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})
