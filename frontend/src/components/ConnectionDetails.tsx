import React, { useRef, useState, useEffect } from 'react'
import useResizeObserver from 'use-resize-observer'
import { makeStyles } from '@mui/styles'
import { Typography, InputLabel, Collapse, Paper } from '@mui/material'
import { getAttributes } from './Attributes'
import { useApplication } from '../hooks/useApplication'
import { LaunchButton } from '../buttons/LaunchButton'
import { DataDisplay } from './DataDisplay'
import { IconButton } from '../buttons/IconButton'
import { CopyButton } from '../buttons/CopyButton'
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
  const [hover, setHover] = useState<'name' | 'port' | 'copy' | 'launch' | 'copyLaunch' | undefined>()
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

  if (connection?.connecting) {
    name = 'Connecting...'
    port = undefined
  }
  const p = port ? ':' : ''

  const basicDisplay = (
    <div ref={basicRef} className={hover ? css.hide : css.show}>
      <InputLabel shrink>Local Address</InputLabel>
      <Typography variant="h3" className={css.h3}>
        {name}
        {port && (
          <>
            {p}
            {port}
          </>
        )}
      </Typography>
    </div>
  )

  const nameDisplay = (
    <div className={hover === 'name' ? css.show : css.hide}>
      <InputLabel shrink>Copy Hostname</InputLabel>
      <Typography variant="h3" className={css.h3}>
        {name && <span className={css.active}>{name}</span>}
        {port && (
          <>
            {p}
            {port}
          </>
        )}
      </Typography>
    </div>
  )

  const portDisplay = (
    <div className={hover === 'port' ? css.show : css.hide}>
      <InputLabel shrink>Copy Port</InputLabel>
      <Typography variant="h3" className={css.h3}>
        {name}
        {p}
        <span className={css.active}>{port}</span>
      </Typography>
    </div>
  )

  const copyDisplay = (
    <div ref={copyRef} className={hover === 'copy' ? css.show : css.hide}>
      <InputLabel shrink>Copy Local Address</InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span className={css.active}>
          {name}
          {p}
          {port}
        </span>
      </Typography>
    </div>
  )

  const launchDisplay = (
    <div ref={launchRef} className={hover === 'launch' || hover === 'copyLaunch' ? css.show : css.hide}>
      <InputLabel shrink>
        {hover === 'copyLaunch' ? 'Copy ' : 'Launch '}
        {app.contextTitle}
      </InputLabel>
      <Typography variant="h3" className={css.h3}>
        <span className={hover === 'copyLaunch' ? css.active : ''}>{app.string}</span>
      </Typography>
    </div>
  )

  return (
    <Collapse in={show} timeout={800}>
      <Gutters top="lg" bottom={null}>
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
              <Gutters size="md" top="sm" bottom="xs" className={css.buttons}>
                <span>
                  <InputLabel shrink>Copy</InputLabel>
                  <CopyButton
                    color="alwaysWhite"
                    icon="copy"
                    value={name + (port ? p + port : '')}
                    onMouseEnter={() => setHover('copy')}
                    onMouseLeave={() => setHover(undefined)}
                  />
                  {connection?.host && (
                    <>
                      {connection.port && (
                        <>
                          <CopyButton
                            color="alwaysWhite"
                            icon="i-cursor"
                            value={connection.host}
                            onMouseEnter={() => setHover('name')}
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
                    <IconButton title="Command launch in Desktop" name="ban" fixedWidth />
                  )}
                </span>
              </Gutters>
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
    // transition: 'opacity 300ms',
  },
  hide: {
    opacity: 0,
    position: 'absolute',
    // transitionProperty: 'opacity',
    // transitionDuration: '300ms',
    // transitionDelay: '150ms',
  },
  active: {
    display: 'inline-block',
    backgroundColor: palette.screen.main,
    borderRadius: spacing.xs,
    textDecoration: `underline 2px`,
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
  },
}))
