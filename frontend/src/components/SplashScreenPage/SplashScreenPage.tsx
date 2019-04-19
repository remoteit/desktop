import debug from 'debug'
import React, { useEffect, useState } from 'react'
// import { INITIALIZED, useStore } from '../../store'
import { Logo } from '../Logo'
// import { navigate } from 'hookrouter'
import { TextField, Button } from '@material-ui/core'
import io from 'socket.io-client'
import { Icon } from '../Icon'
import { useClipboard } from 'use-clipboard-copy'

const d = debug('r3:components:SplashScreenPage')

// TODO: Move somewhere smart...
const socket = io('http://localhost:29999')
socket.on('connect', () => console.log('connect'))
socket.on('event', (data: any) => console.log('event:', data))
socket.on('disconnect', () => console.log('connect'))

export function SplashScreenPage() {
  // const [{ initializing }, dispatch] = useStore()
  const [installing, setInstalling] = useState<boolean>(false)
  const [installed, setInstalled] = useState<boolean>(false)
  const [currentVersion, setCurrentVersion] = useState<string | null>(null)
  const [exists, setExists] = useState<boolean>(false)
  const [path, setPath] = useState<string | null>(null)
  const clipboard = useClipboard({ copiedTimeout: 1000 })

  useEffect(() => {
    // setTimeout(() => dispatch({ type: INITIALIZED }), 800)
    // dispatch({ type: INITIALIZED })

    function getInfo() {
      socket.emit(
        'connectd/info',
        (info: { path: string; version: string | null; exists: boolean }) => {
          d('connectd info: %O', info)
          if (info.exists) setExists(true)
          if (info.path) setPath(info.path)
          if (info.exists && info.version) setCurrentVersion(info.version)
        }
      )
    }

    socket.on('connectd/install/done', (version: string) => {
      setCurrentVersion(version)
      setInstalling(false)
      setInstalled(true)
    })

    // socket.on('connectd/file/watching', () =>
    //   console.log('watching for changes')
    // )
    socket.on('connectd/file/added', () => {
      getInfo()
    })
    socket.on('connectd/file/udpated', () => {
      getInfo()
    })
    socket.on('connectd/file/removed', () => {
      getInfo()
      setExists(false)
      setCurrentVersion(null)
    })
    socket.on('connectd/file/error', (error: Error) => console.error(error))

    getInfo()

    return () => {
      socket.off('connectd/install/done')
    }
  }, [installing, installed])

  // if (initializing) return <h1>Starting up...</h1>

  const latestVersion = '4.5'
  const updateAvailable = currentVersion && currentVersion < latestVersion

  // TODO: Translate this...
  let buttonText = 'Install connectd'
  if (currentVersion && updateAvailable) buttonText = 'Update connectd'
  if (currentVersion && !updateAvailable) buttonText = 'Reinstall connectd'
  if (installing) buttonText = 'Installing connectd...'

  // TODO: Translate this...
  let versionMessage =
    'You do not have connectd installed, please install it now'
  if (currentVersion && updateAvailable)
    versionMessage = `Your version of connectd (${currentVersion}) is out of date. Please upgrade to latest version ${latestVersion}.`
  if (currentVersion && !updateAvailable)
    versionMessage = `Your version of connectd (${currentVersion}) is up to date!`
  if (installing) versionMessage = 'Installing connectd...'

  return (
    <div className="p-lg mx-auto" style={{ maxWidth: '580px' }}>
      <div className="center mb-md">
        <Logo />
      </div>
      <div className="center mb-md bg-gray-lighter rad-sm p-md">
        <div className="">
          <Button
            color="primary"
            fullWidth
            className="mr-md"
            variant="contained"
            disabled={installing}
            onClick={async () => {
              setInstalling(true)
              socket.emit('connectd/install')
            }}
            size="large"
          >
            <Icon
              name={installing ? 'spinner-third' : 'arrow-to-bottom'}
              spin={installing}
              className="mr-sm"
            />
            {buttonText}
          </Button>
        </div>
        <div className="txt-sm gray mt-sm">{versionMessage}</div>
      </div>
      {exists && path && (
        <div className="df mb-md ai-center">
          <TextField
            fullWidth
            type="text"
            value={path}
            label="connectd path"
            onFocus={e => e.target.select()}
            inputRef={clipboard.target}
            InputProps={{
              readOnly: true,
            }}
          />
          <Button
            className="ml-md"
            variant="contained"
            onClick={clipboard.copy}
          >
            <Icon
              name={clipboard.copied ? 'clipboard-check' : 'clipboard'}
              className="mr-xs"
            />
            {clipboard.copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      )}
      <div className="mt-lg center">
        <Button
          href="https://docs.remote.it/"
          target="_blank"
          color="secondary"
          variant="outlined"
        >
          View Documentation
          <Icon name="external-link" className="ml-sm" />
        </Button>
      </div>
    </div>
  )
}
