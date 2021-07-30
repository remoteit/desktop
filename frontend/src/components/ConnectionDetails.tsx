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
  const [hover, setHover] = React.useState<'name' | 'port' | 'copy' | 'launch' | undefined>()
  const { ui } = useDispatch<Dispatch>()
  const app = useApplication('copy', service, connection)
  const css = useStyles()

  if (!connection) return null

  const address = app.address.split(':')
  const name = address[0]
  const port = address[1]
  let h2Css = css.h2
  let label = 'Address'
  let display: JSX.Element | string = (
    <>
      {name && <span className={hover === 'name' ? css.active : undefined}>{name}</span>}
      {port && (
        <>
          :<span className={hover === 'port' ? css.active : undefined}>{port}</span>
        </>
      )}
    </>
  )

  if (hover === 'launch' || hover === 'copy') {
    label = hover === 'copy' ? 'Command' : 'Launch'
    app.context = hover
    display = app.command
    h2Css += ' ' + css.active
  }

  return (
    <Collapse in={show} timeout={800}>
      <Gutters bottom={null}>
        <Paper className={css.address} elevation={0}>
          <Gutters size="md" bottom={null}>
            <InputLabel shrink>{label}</InputLabel>
            <Typography variant="h2" className={h2Css}>
              {display}
            </Typography>
          </Gutters>
          <Gutters size="md" top="sm" bottom="xs" className={css.buttons}>
            <span>
              <InputLabel shrink>Copy</InputLabel>
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
                  onMouseEnter={() => setHover('copy')}
                  onMouseLeave={() => setHover(undefined)}
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
              <InputLabel shrink>Launch</InputLabel>
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
                  onMouseEnter={() => setHover('launch')}
                  onMouseLeave={() => setHover(undefined)}
                />
              </GuideStep>
            </span>
          </Gutters>
        </Paper>
        {details && (
          <Gutters size={null} bottom="xs">
            <DataDisplay attributes={attributes} connection={connection} session={session} width={100} disablePadding />
          </Gutters>
        )}
      </Gutters>
    </Collapse>
  )
}

const useStyles = makeStyles({
  active: {
    borderRadius: 4,
    backgroundColor: colors.darken,
  },
  h2: {
    wordBreak: 'break-all',
    overflow: 'hidden',
    fontWeight: 500,
    lineHeight: '1.33em',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    transition: 'height 200ms',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    '& span': { wordBreak: 'break-word' },
  },
  address: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: spacing.xs,
    '& label': { color: colors.white },
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
  },
})
