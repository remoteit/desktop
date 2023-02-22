import React, { useRef, useState, useEffect } from 'react'
import classnames from 'classnames'
import useResizeObserver from 'use-resize-observer'
import { makeStyles } from '@mui/styles'
import { getEndpoint } from '../helpers/connectionHelper'
import { Typography, InputLabel, Collapse, Paper, Box, alpha } from '@mui/material'
import { useApplication } from '../hooks/useApplication'
import { LaunchButton } from '../buttons/LaunchButton'
import { GuideBubble } from './GuideBubble'
import { IconButton } from '../buttons/IconButton'
import { CopyIconButton } from '../buttons/CopyIconButton'
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
  children?: React.ReactNode
}

export const ConnectionDetails: React.FC<Props> = ({ showTitle, show, connection, service, session, children }) => {
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

  const endpoint = getEndpoint(connection)
  const endpointName = (connection?.public ? 'Public' : 'Local') + ' Endpoint'

  const basicDisplay = (
    <div ref={basicRef} className={hover ? css.hide : css.show}>
      <InputLabel shrink>
        {endpointName} {copied}
      </InputLabel>
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
        {name && <span>{name}</span>}
        {port && <span className={css.inactive}>:{port}</span>}
      </Typography>
    </div>
  )

  const portDisplay = (
    <div className={hover === 'port' ? css.show : css.hide}>
      <InputLabel shrink>Port</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span className={css.inactive}>{name}:</span>
        <span>{port}</span>
      </Typography>
    </div>
  )

  const copyDisplay = (
    <div ref={copyRef} className={hover === 'endpoint' ? css.show : css.hide}>
      <InputLabel shrink>{endpointName}</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span>{endpoint}</span>
      </Typography>
    </div>
  )

  const launchDisplay = (
    <div ref={launchRef} className={hover === 'launch' || hover === 'copyLaunch' ? css.show : css.hide}>
      <InputLabel shrink>{app.contextTitle}</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span>{app.string}</span>
      </Typography>
    </div>
  )

  return (
    <Collapse in={show}>
      <Paper className={css.paper} elevation={0}>
        <Box className={classnames(css.address, !(connection?.enabled || session) && css.disabled)}>
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
                    <InputLabel shrink>
                      Copy {hover === 'launch' ? '' : hover === 'copyLaunch' ? app.contextTitle : hover}
                    </InputLabel>
                    <CopyIconButton
                      ref={buttonRef}
                      color="alwaysWhite"
                      icon="clone"
                      value={endpoint}
                      onMouseEnter={() => setHover('endpoint')}
                      onMouseLeave={() => setHover(undefined)}
                      onCopy={() => setCopied(undefined)}
                    />
                    {connection?.host && (
                      <>
                        {connection.port && (
                          <>
                            <CopyIconButton
                              color="alwaysWhite"
                              icon="i-cursor"
                              value={connection.host}
                              onMouseEnter={() => setHover('host')}
                              onMouseLeave={() => setHover(undefined)}
                            />
                            <CopyIconButton
                              color="alwaysWhite"
                              icon="port"
                              value={connection.port}
                              onMouseEnter={() => setHover('port')}
                              onMouseLeave={() => setHover(undefined)}
                            />
                          </>
                        )}
                        {app.launchType !== 'NONE' && (
                          <CopyIconButton
                            color="alwaysWhite"
                            icon={app.launchType === 'URL' ? 'link' : 'terminal'}
                            app={app}
                            value={app.string}
                            onMouseEnter={() => setHover('copyLaunch')}
                            onMouseLeave={() => setHover(undefined)}
                          />
                        )}
                      </>
                    )}
                  </span>
                  {app.canShare && (
                    <span className={css.share}>
                      <InputLabel shrink>Share</InputLabel>
                      <CopyIconButton
                        color="alwaysWhite"
                        icon="share"
                        value={app.string}
                        onClick={() => navigator.share?.({ url: app.string })}
                      />
                    </span>
                  )}
                  {app.launchType !== 'NONE' && (
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
                        <IconButton
                          title="To launch, change your launch type to URL or download the desktop app"
                          name="ban"
                          type="regular"
                          color="alwaysWhite"
                          size="lg"
                          fixedWidth
                        />
                      )}
                    </span>
                  )}
                </Gutters>
              </GuideBubble>
            </>
          )}
        </Box>
        {children}
      </Paper>
    </Collapse>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  show: {
    opacity: 1,
    position: 'absolute',
  },
  hide: {
    opacity: 0,
    position: 'absolute',
    pointerEvents: 'none',
  },
  inactive: {
    color: alpha(palette.alwaysWhite.main, 0.25),
  },
  h3: {
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
    '& label': { color: palette.alwaysWhite.main },
  },
  paper: {
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  disabled: {
    backgroundColor: palette.gray.main,
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
