import React, { useRef, useState, useEffect } from 'react'
import useResizeObserver from 'use-resize-observer'
import { makeStyles } from '@mui/styles'
import { Typography, InputLabel, Collapse, Paper, alpha } from '@mui/material'
import { getAttributes } from './Attributes'
import { useApplication } from '../hooks/useApplication'
import { LaunchButton } from '../buttons/LaunchButton'
import { GuideBubble } from './GuideBubble'
import { DataDisplay } from './DataDisplay'
import { IconButton } from '../buttons/IconButton'
import { CopyButton } from '../buttons/CopyButton'
import { DesktopUI } from './DesktopUI'
import { PortalUI } from './PortalUI'
import { Gutters } from './Gutters'
import { spacing } from '../styling'

type Props = {
  connection?: IConnection
  service?: IService
  session?: ISession
  showTitle?: string
  show?: boolean
}

export const ConnectionDetails: React.FC<Props> = ({ showTitle, show, connection, service, session }) => {
  const attributes = getAttributes(['lanShare', 'connection', 'duration', 'location', 'initiatorPlatform'])
  const basicRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const launchRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState<'host' | 'port' | 'endpoint' | 'launch' | 'copyLaunch' | undefined>()
  const [copied, setCopied] = useState<string | undefined>()
  const [displayHeight, setDisplayHeight] = useState<number>(33)
  const app = useApplication(service, connection)
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
    const timeout = setTimeout(measure, 100)
    return () => clearTimeout(timeout)
  }, [connection, service])

  if (!connection && !session) return null

  let name = connection?.host
  let port = connection?.port

  if ((port === -1 || !name) && !connection?.enabled) {
    name = 'Starting...'
    port = undefined
  }

  if (!name && connection?.connecting) {
    name = 'Connecting...'
    port = undefined
  }

  const endpoint = name + (port ? ':' + port : '')

  const basicDisplay = (
    <div ref={basicRef} className={hover ? css.hide : css.show}>
      <InputLabel shrink>Local Endpoint {copied}</InputLabel>
      <Typography
        variant="h3"
        className={css.h3}
        onClick={() => {
          buttonRef.current?.click()
          setCopied('Copied!')
        }}
      >
        {endpoint}
      </Typography>
    </div>
  )

  const nameDisplay = (
    <div className={hover === 'host' ? css.show : css.hide}>
      <InputLabel shrink>Host</InputLabel>
      <Typography variant="h3" className={css.h3}>
        {name && <span className={css.active}>{name}</span>}
        {port && <span className={css.inactive}>:{port}</span>}
      </Typography>
    </div>
  )

  const portDisplay = (
    <div className={hover === 'port' ? css.show : css.hide}>
      <InputLabel shrink>Port</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span className={css.inactive}>{name}:</span>
        <span className={css.active}>{port}</span>
      </Typography>
    </div>
  )

  const copyDisplay = (
    <div ref={copyRef} className={hover === 'endpoint' ? css.show : css.hide}>
      <InputLabel shrink>Local Endpoint</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span className={css.active}>{endpoint}</span>
      </Typography>
    </div>
  )

  const launchDisplay = (
    <div ref={launchRef} className={hover === 'launch' || hover === 'copyLaunch' ? css.show : css.hide}>
      <InputLabel shrink>{app.contextTitle}</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span className={hover === 'copyLaunch' ? css.active : ''}>{app.string}</span>
      </Typography>
    </div>
  )

  return (
    <Collapse in={show}>
      <Gutters top="md" size="md" bottom={null}>
        <Paper className={css.address} elevation={0}>
          {!!showTitle ? (
            <Gutters size="md">
              <InputLabel shrink>User</InputLabel>
              <Typography variant="h2">{showTitle}</Typography>
            </Gutters>
          ) : (
            <>
              <Gutters size="md" bottom={null}>
                <div style={{ height: displayHeight, position: 'relative', transition: 'height 200ms' }} ref={ref}>
                  {basicDisplay}
                  {nameDisplay}
                  {portDisplay}
                  {copyDisplay}
                  {launchDisplay}
                </div>
              </Gutters>
              <GuideBubble
                hide={!show}
                guide="usingConnection"
                enterDelay={600}
                placement="left"
                startDate={new Date('2022-09-20')}
                queueAfter="connectButton"
                instructions={
                  <>
                    <Typography variant="h3" gutterBottom>
                      <b>Using a connection</b>
                    </Typography>
                    <PortalUI>
                      <Typography variant="body2" gutterBottom>
                        A connection was created from our proxy server to the service.
                      </Typography>
                    </PortalUI>
                    <DesktopUI>
                      <Typography variant="body2" gutterBottom>
                        A fixed endpoint has been generated.
                      </Typography>
                    </DesktopUI>
                    <Typography variant="body2" gutterBottom>
                      Copy the endpoint and its components or launch an application according the the
                      <cite> launch method </cite>
                      configuration below.
                    </Typography>
                  </>
                }
              >
                <Gutters size="md" top="sm" bottom="xs" className={css.buttons}>
                  <span>
                    <InputLabel shrink>Copy {hover === 'copyLaunch' ? app.contextTitle : hover}</InputLabel>
                    <CopyButton
                      ref={buttonRef}
                      color="alwaysWhite"
                      icon="copy"
                      value={endpoint}
                      onMouseEnter={() => setHover('endpoint')}
                      onMouseLeave={() => setHover(undefined)}
                      onCopy={() => setCopied(undefined)}
                    />
                    {connection?.host && (
                      <>
                        {connection.port && (
                          <>
                            <CopyButton
                              color="alwaysWhite"
                              icon="i-cursor"
                              value={connection.host}
                              onMouseEnter={() => setHover('host')}
                              onMouseLeave={() => setHover(undefined)}
                            />
                            <CopyButton
                              color="alwaysWhite"
                              icon="port"
                              value={connection.port}
                              onMouseEnter={() => setHover('port')}
                              onMouseLeave={() => setHover(undefined)}
                            />
                          </>
                        )}
                        <CopyButton
                          color="alwaysWhite"
                          icon={app.launchType === 'URL' ? 'link' : 'terminal'}
                          app={app}
                          value={app.string}
                          onMouseEnter={() => setHover('copyLaunch')}
                          onMouseLeave={() => setHover(undefined)}
                        />
                      </>
                    )}
                  </span>
                  {app.canShare && (
                    <span className={css.share}>
                      <InputLabel shrink>Share</InputLabel>
                      <CopyButton
                        color="alwaysWhite"
                        icon="arrow-up-from-bracket"
                        value={app.string}
                        onClick={() => navigator.share?.({ text: endpoint })}
                      />
                    </span>
                  )}
                  <span>
                    <InputLabel shrink>Launch</InputLabel>
                    {app.canLaunch ? (
                      <LaunchButton
                        color="alwaysWhite"
                        app={app}
                        onMouseEnter={() => setHover('launch')}
                        onMouseLeave={() => setHover(undefined)}
                      />
                    ) : (
                      <IconButton title="Download the desktop app to launch" name="ban" fixedWidth />
                    )}
                  </span>
                </Gutters>
              </GuideBubble>
            </>
          )}
        </Paper>
        <Paper className={css.details} elevation={0}>
          <Gutters bottom="xs">
            <DataDisplay attributes={attributes} connection={connection} session={session} width={100} disablePadding />
          </Gutters>
        </Paper>
      </Gutters>
    </Collapse>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  show: {
    opacity: 1,
    position: 'absolute',
    // transition: 'opacity 100ms',
  },
  hide: {
    opacity: 0,
    position: 'absolute',
    pointerEvents: 'none',
    // transitionProperty: 'opacity',
    // transitionDuration: '100ms',
    // transitionDelay: '50ms',
  },
  active: {
    // display: 'inline-block',
    // backgroundColor: palette.screen.main,
    // borderRadius: spacing.xs,
    // color: palette.alwaysWhite.main,
  },
  inactive: {
    color: alpha(palette.alwaysWhite.main, 0.25),
  },
  h3: {
    // cursor: 'pointer',
    wordBreak: 'break-word',
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
    backgroundColor: palette.primary.main,
    color: palette.alwaysWhite.main,
    padding: spacing.xs,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    '& label': { color: palette.alwaysWhite.main },
  },
  details: {
    paddingTop: 1,
    paddingBottom: spacing.md,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
    '& > :first-of-type': { flexGrow: 1 },
  },
  share: {
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginRight: spacing.md,
    '& label': { transformOrigin: 'top center' },
  },
}))
