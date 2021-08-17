import React, { useRef, useState, useEffect } from 'react'
import useResizeObserver from 'use-resize-observer'
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
  const basicRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const launchRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<'name' | 'port' | 'copy' | 'launch' | undefined>()
  const [displayHeight, setDisplayHeight] = useState<number>(0)
  const { ui } = useDispatch<Dispatch>()
  const app = useApplication('copy', service, connection)
  const css = useStyles()

  const measure = () => {
    const height = Math.max(
      Number(basicRef.current?.offsetHeight),
      Number(copyRef.current?.offsetHeight),
      Number(launchRef.current?.offsetHeight)
    )
    if (height !== displayHeight) {
      setDisplayHeight(height)
    }
  }

  const { ref } = useResizeObserver<HTMLDivElement>({ onResize: measure })

  useEffect(() => {
    setTimeout(measure, 100)
  }, [connection, service])

  if (!connection) return null

  const address = app.address.split(':')
  const name = address[0]
  const port = address[1]

  const basicDisplay = (
    <div ref={basicRef} className={hover ? css.hide : css.show}>
      <InputLabel shrink>Address</InputLabel>
      <Typography variant="h2" className={css.h2}>
        {name && <span className={hover === 'name' ? css.active : undefined}>{name}</span>}
        {port && (
          <>
            :<span className={hover === 'port' ? css.active : undefined}>{port}</span>
          </>
        )}
      </Typography>
    </div>
  )

  const nameDisplay = (
    <div className={hover === 'name' ? css.show : css.hide}>
      <InputLabel shrink>Copy Hostname</InputLabel>
      <Typography variant="h2" className={css.h2}>
        {name && <span className={css.active}>{name}</span>}
        {port && <>:{port}</>}
      </Typography>
    </div>
  )

  const portDisplay = (
    <div className={hover === 'port' ? css.show : css.hide}>
      <InputLabel shrink>Copy Port</InputLabel>
      <Typography variant="h2" className={css.h2}>
        {name}:<span className={css.active}>{port}</span>
      </Typography>
    </div>
  )

  const copyDisplay = (
    <div ref={copyRef} className={hover === 'copy' ? css.show : css.hide}>
      <InputLabel shrink>Copy Command</InputLabel>
      <Typography variant="h2" className={css.h2}>
        <span className={css.active}>{app.command}</span>
      </Typography>
    </div>
  )

  app.context = 'launch'
  const launchDisplay = (
    <div ref={launchRef} className={hover === 'launch' ? css.show : css.hide}>
      <InputLabel shrink>{app.contextTitle}</InputLabel>
      <Typography variant="h2" className={css.h2}>
        <span className={css.active}>{app.command}</span>
      </Typography>
    </div>
  )

  return (
    <Collapse in={show} timeout={800}>
      <Gutters bottom={null}>
        <Paper className={css.address} elevation={0}>
          <Gutters size="md" bottom={null}>
            <div style={{ height: displayHeight, position: 'relative', transition: 'height 200ms' }} ref={ref}>
              {basicDisplay}
              {nameDisplay}
              {portDisplay}
              {copyDisplay}
              {launchDisplay}
            </div>
          </Gutters>
          <Gutters size="md" top="sm" bottom="xs" className={css.buttons}>
            <span>
              <InputLabel shrink>Copy</InputLabel>
              <GuideStep
                guide="guideAWS"
                step={6}
                instructions="Copy this address for use in your application. It will connect on demand even if you close remoteit."
                placement="left"
                component="span"
              >
                <CommandButton
                  color="white"
                  type="solid"
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
                onMouseEnter={() => setHover('name')}
                onMouseLeave={() => setHover(undefined)}
              />
              <CopyButton
                color="white"
                icon="port"
                type="solid"
                size="md"
                value={connection.port}
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
  show: {
    opacity: 1,
    position: 'absolute',
    transition: 'opacity 200ms',
  },
  hide: {
    opacity: 0,
    position: 'absolute',
    transitionProperty: 'opacity',
    transitionDuration: '200ms',
    transitionDelay: '50ms',
  },
  active: {
    borderRadius: 4,
    backgroundColor: colors.darken,
  },
  h2: {
    fontWeight: 500,
    lineHeight: '1.33em',
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
