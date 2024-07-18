import React, { useRef, useState, useEffect } from 'react'
import useResizeObserver from 'use-resize-observer'
import { makeStyles } from '@mui/styles'
import { replaceHost } from '@common/nameHelper'
import { Application } from '@common/applications'
import { Typography, Tooltip, Collapse, Paper, Box, alpha } from '@mui/material'
import { getEndpoint, isSecureReverseProxy } from '../helpers/connectionHelper'
import { LaunchQuickSelect } from './LaunchQuickSelect'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { GuideBubble } from './GuideBubble'
import { IconButton } from '../buttons/IconButton'
import { DesktopUI } from './DesktopUI'
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import { Icon } from './Icon'

type Props = {
  showTitle?: string
  show?: boolean
  app: Application
  connection?: IConnection
  session?: ISession
  children?: React.ReactNode
}

export const ConnectionDetails: React.FC<Props> = ({ showTitle, show, app, connection, session, children }) => {
  const basicRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const launchRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState<'host' | 'port' | 'endpoint' | 'launch' | 'copy' | undefined>()
  const [copied, setCopied] = useState<string | undefined>()
  const [displayHeight, setDisplayHeight] = useState<number>(33)
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
  }, [connection, app])

  if (!connection && !session) return null

  let name = replaceHost(connection?.host)
  let port = connection?.port

  const disabled = !(connection?.enabled || session) || !connection?.online
  const endpoint = getEndpoint(name, port)
  const endpointName = (connection?.public || connection?.connectLink ? 'Public' : 'Local') + ' Endpoint'
  const secureReverseProxy = isSecureReverseProxy(app.string)
  const secureIcon = secureReverseProxy === false && (
    <Tooltip title="Local connection unencrypted">
      <Icon name="triangle-exclamation" size="base" type="solid" inlineLeft />
    </Tooltip>
  )

  const basicDisplay = (
    <div ref={basicRef} className={hover ? css.hide : css.show}>
      <Typography variant="h5" color="alwaysWhite.main">
        {endpointName} {copied}
      </Typography>
      <Typography
        variant="h3"
        className={css.h3}
        onClick={() => {
          buttonRef.current?.click()
          setCopied('Copied')
        }}
      >
        {secureIcon}
        {endpoint}
      </Typography>
    </div>
  )

  const nameDisplay = (
    <div className={hover === 'host' ? css.show : css.hide}>
      <Typography variant="h5" color="alwaysWhite.main">
        Host
      </Typography>
      <Typography variant="h3" className={css.h3}>
        {secureIcon}
        {name && <span>{name}</span>}
        {port && <span className={css.inactive}>:{port}</span>}
      </Typography>
    </div>
  )

  const portDisplay = (
    <div className={hover === 'port' ? css.show : css.hide}>
      <Typography variant="h5" color="alwaysWhite.main">
        Port
      </Typography>
      <Typography variant="h3" className={css.h3}>
        {secureIcon}
        <span className={css.inactive}>{name}:</span>
        <span>{port}</span>
      </Typography>
    </div>
  )

  const copyDisplay = (
    <div ref={copyRef} className={hover === 'endpoint' ? css.show : css.hide}>
      <Typography variant="h5" color="alwaysWhite.main">
        {endpointName}
      </Typography>
      <Typography variant="h3" className={css.h3}>
        {secureIcon}
        <span>{endpoint}</span>
      </Typography>
    </div>
  )

  const launchDisplay = (
    <div ref={launchRef} className={hover === 'launch' || hover === 'copy' ? css.show : css.hide}>
      <Typography variant="h5" color="alwaysWhite.main">
        {app.contextTitle}
      </Typography>
      <Typography variant="h3" className={css.h3}>
        {secureIcon}
        <span>{app.sshConfigString}</span>
      </Typography>
    </div>
  )

  return (
    <Collapse in={show}>
      <Paper className={css.paper} elevation={0}>
        <Box className={css.address} sx={{ bgcolor: disabled ? 'gray.main' : 'primary.main' }}>
          {!!showTitle ? (
            <Gutters size="md">
              <Typography variant="h5" color="alwaysWhite.main">
                User
              </Typography>
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
                enterDelay={800}
                placement="bottom"
                startDate={new Date('2022-09-20')}
                queueAfter="connectButton"
                instructions={
                  <>
                    <Typography variant="h3" gutterBottom>
                      <b>Using a connection</b>
                    </Typography>
                    <DesktopUI hide>
                      <Typography variant="body2" gutterBottom>
                        A connection was created to this service.
                      </Typography>
                    </DesktopUI>
                    <DesktopUI>
                      <Typography variant="body2" gutterBottom>
                        A fixed endpoint has been generated.
                      </Typography>
                    </DesktopUI>
                    <Typography variant="body2" gutterBottom>
                      Copy the endpoint or launch the application according to the
                      <cite> launch method </cite>
                      configured in the connection configuration.
                    </Typography>
                  </>
                }
              >
                <Gutters size="md" top="sm" bottom="xs" className={css.buttons}>
                  <span>
                    <Typography variant="h5" color="alwaysWhite.main" sx={{ my: 0.5 }}>
                      Copy {hover === 'launch' ? '' : hover === 'copy' ? app.contextTitle : hover}
                    </Typography>
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
                              icon="host"
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
                        <CopyIconButton
                          color="alwaysWhite"
                          icon={app.copyIcon}
                          app={app}
                          value={app.sshConfigString}
                          onMouseEnter={() => setHover('copy')}
                          onMouseLeave={() => setHover(undefined)}
                        />
                      </>
                    )}
                  </span>
                  {app.canShare && (
                    <span className={css.share}>
                      <Typography variant="h5" color="alwaysWhite.main" sx={{ my: 0.5 }}>
                        Share
                      </Typography>
                      <CopyIconButton
                        color="alwaysWhite"
                        icon="share"
                        value={app.string}
                        onClick={() => navigator.share?.({ url: app.string })}
                        onMouseEnter={() => setHover('launch')}
                        onMouseLeave={() => setHover(undefined)}
                      />
                    </span>
                  )}
                  {app.launchType !== 'NONE' && (
                    <span className={css.marginLeft}>
                      <LaunchQuickSelect app={app} disabled={disabled} />
                      {app.canLaunch ? (
                        <LaunchButton
                          app={app}
                          size="lg"
                          color="alwaysWhite"
                          connection={connection}
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
    marginTop: spacing.xs,
    marginBottom: spacing.xxs,
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    '& span': { wordBreak: 'break-word' },
  },
  address: {
    color: palette.alwaysWhite.main,
    padding: spacing.xs,
    '& label': { color: palette.alwaysWhite.main },
  },
  paper: {
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
    '& > :first-of-type': { flexGrow: 1 },
  },
  share: {
    display: 'inline-flex',
    alignItems: 'center',
    flexDirection: 'column',
  },
  marginLeft: {
    marginLeft: spacing.md,
  },
}))
